## Mobile eats backend server

This is the backend server for a food delivery web application. It is built using Node.js and MongoDB to handle vendor and customer data, order management, and delivery fee calculations.

### Features

- User authentication and authorization
- Vendor management
- Customer management
- Order placement and tracking
- Menu management for vendors
- Distance based delivery fee calculation

### Technologies used

- Typescript
- Mongo DB
- Docker
- Mongoose
- Nodemailer
- Sendgrid

### Prerequisites

- Node.js installed on your system
- MongoDB database connection

### Installation

1. Clone the repository

```
git clone https://github.com/munene-m/food-delivery-server.git
```

2. Navigate to the api folder

```
cd api
```

3. Install the dependencies

```
npm install
```

4. Set up environment variables

- Create a `.env` file in the root directory.
- Define the required environment variables in the .env file (e.g., database connection URL, JWT secret, Session secret, email service credentials).

### Usage

1. Start the server

```
npm run start
```

2. Access the API endpoints using the specified routes and methods.

3. Use a tool like Insomnia or Postman to test the API endpoints.
