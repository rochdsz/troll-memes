terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
    google  = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

provider "azurerm" { 
    features {} 
    skip_provider_registration = true
}
provider "google" { 
    project = "mca2533" 
}

# ==========================================
# GCP: Cloud SQL (PostgreSQL)
# ==========================================
resource "random_password" "db_password" {
  length  = 16
  special = false
}

resource "google_sql_database_instance" "postgres" {
  name             = "troll-memes-db-prod"
  database_version = "POSTGRES_15"
  region           = "asia-south1"
  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0" # Allows Azure VM to connect
      }
    }
  }
  deletion_protection = false
}

resource "google_sql_user" "db_user" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

resource "google_sql_database" "db" {
  name     = "troll_memes_db"
  instance = google_sql_database_instance.postgres.name
}

# ==========================================
# Azure: Compute & Networking
# ==========================================
resource "azurerm_resource_group" "rg" {
  name     = "troll-memes-rg"
  location = "indiasouthcentral"
}

resource "azurerm_virtual_network" "vnet" {
  name                = "troll-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "troll-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "ip" {
  name                = "troll-public-ip"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_security_group" "nsg" {
  name                = "troll-nsg"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP_NextJS"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_interface" "nic" {
  name                = "troll-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.ip.id
  }
}

resource "azurerm_network_interface_security_group_association" "nsg_link" {
  network_interface_id      = azurerm_network_interface.nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

resource "azurerm_linux_virtual_machine" "vm" {
  name                  = "troll-memes-vm"
  resource_group_name   = azurerm_resource_group.rg.name
  location              = azurerm_resource_group.rg.location
  size                  = "Standard_B1s"
  admin_username        = "ubuntu"
  network_interface_ids = [azurerm_network_interface.nic.id]

  admin_ssh_key {
    username   = "ubuntu"
    public_key = file("~/cloud_lab_rsa.pub")  
}

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  # Install Docker automatically on boot
  custom_data = base64encode(<<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              EOF
  )
}

# ==========================================
# Outputs
# ==========================================
output "azure_vm_public_ip" { value = azurerm_public_ip.ip.ip_address }
output "gcp_db_connection_string" { 
  value     = "postgresql://postgres:${random_password.db_password.result}@${google_sql_database_instance.postgres.public_ip_address}:5432/troll_memes_db?schema=public"
  sensitive = true 
}