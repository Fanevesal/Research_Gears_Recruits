**🔗 Live Demo:** [https://recruits.sokoni.africa/](https://recruits.sokoni.africa/)


# Research_Gears_Recruits

Welcome to **Research_Gears_Recruits**, the ultimate playground for tech enthusiasts who love to tinker, hack, and innovate. This repo is based on **Sokoni Africa**, and it's your sandbox to inspect, break, fix, and reimagine a full-stack marketplace app.

---

## Objective

Your mission (should you choose to accept it):

1. **Peek Under the Hood**

   * Explore the codebase, get to know the architecture, and understand the magic behind the scenes.

2. **Spot the Flaws**

   * Hunt for bugs, performance bottlenecks, and security loopholes.
   * Make notes like a true code detective.

3. **Upgrade, Rebuild, or Innovate**

   * Refactor, optimize, or totally reinvent modules.
   * Migrate old-school code to modern frameworks.
   * Build your own version and make it stand out.

4. **Plug in Your Own APIs**

   * The existing backend is hosted on a VPS with a sandbox/sample API.
   * Use any tech stack for frontend.
   * Document your API integration with realistic terminal examples.

5. **Document Your Work**

   * Log all changes, fixes, and upgrades.
   * Provide setup instructions, demos, and bash scripts to automate tasks.

---

## About Sokoni Africa

A vibrant marketplace connecting wholesalers, retailers, and customers. Key features:

* Live product events
* Warehouse and inventory management
* Delivery tracking
* Admin dashboards

Full-stack experience included.

---

## Getting Started

### Prerequisites

* Node.js & npm / Yarn (or any frontend stack)
* PostgreSQL / MySQL / SQLite (or any database)
* Git
* Postman / API tool
* Bash shell

### Bash Automation Scripts with Realistic Terminal Examples

#### 1. Clone and Setup Repo

```bash
$ git clone https://github.com/your-org/Research_Gears_Recruits.git
Cloning into 'Research_Gears_Recruits'...
done.
$ cd Research_Gears_Recruits
$ bash ./scripts/setup.sh
Installing frontend dependencies...
Setting up environment variables...
Setup complete!
```

#### 2. Start Frontend

```bash
$ bash ./scripts/start-frontend.sh
Starting frontend server...
Compiled successfully.
Local: http://localhost:3000
```

#### 3. Run Tests

```bash
$ bash ./scripts/test.sh
Running unit tests...
All tests passed.
Running integration tests...
All integration tests passed.
Running API tests...
All API endpoints responded correctly.
```

#### 4. Build for Production

```bash
$ bash ./scripts/build.sh
Building frontend...
Frontend build completed.
Production build ready in /dist
```

#### 5. API Demo Requests

```bash
$ bash ./scripts/api-demo.sh
# GET /products
{
  "products": [
    {"id":1,"name":"Apple","price":100},
    {"id":2,"name":"Banana","price":50}
  ]
}

# POST /orders
{
  "order_id":12345,
  "status":"success",
  "message":"Order created successfully"
}
```

---

## Tasks for Recruits

* Explore the codebase and hunt for weak spots.
* Document every flaw or bottleneck.
* Build or upgrade custom API integrations.
* Refactor, enhance, or revamp modules.
* Automate tasks with bash scripts for setup, testing, building, and API demos.
* Submit your functional version with full reports and scripts.

### Expected Outcomes

* Fully working Sokoni Africa frontend with your API integrations.
* Realistic bash scripts for setup, testing, building, and API demos.
* Documentation of all enhancements and technical decisions.

---

## Contributing Guidelines

* Write clean, secure, performant code.
* Keep APIs documented and automated with scripts.
* Enhance UX/UI.
* Test, document, and comment your code.

---

## License

Internal training and research only. Respect IP rules.

---

## Need Help?

Ask your supervisor or mentor, but remember, figuring it out is part of the learning process.

---

*Inspect, break, build, automate, and improve.*

