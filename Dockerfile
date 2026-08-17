FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code (including prisma schema and gcp-key.json)
COPY . .

# Generate Prisma Client and Build Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]