# **LO1 – Professional Standard**

## Description

You take responsibility when solving ICT issues. You define and carry out your applied research using relevant selected methodologies and provide advice to your stakeholders in complex and uncertain contexts. You substantiate and validate future-oriented choices by use of law, ethical, intercultural, and sustainable arguments.

## **Further clarification**

You develop and deliver professional products of high quality within a complex context, both individually and as a team, that fits the current question and needs of your stakeholders. Complexity is dictated by the enterprise context and will require a high quality of your work. This enterprise context may contain multiple stakeholders with different interests, is research heavy, has social impact, and may have legal, ethical, intercultural and sustainable considerations.

You apply critical thinking in your day-to-day work and while doing research. Each of the research results can be validated and is relevant and valuable for your specific context. You use a well-known methodology (for instance the DOT framework) to structure your research. You use research results to advice stakeholders.

Your final solution is designed with the possibility for future further development and is transferrable. You deliver professional products according to planning, which is the result of solving problems in a structured and methodical approach. You demonstrate a critical view towards your own and other people’s work. You use appropriate communication considering your role in a team, your audience and the medium to convey your message and results of your software development process.

## Examples

- Research distributed DB trade-offs (consistency vs availability) - compare MongoDB vs Cassandra vs CockroachDB
- Document architectural decisions using C4 diagrams and ADRs (Architecture Decision Records)
- Document working process with sprint retrospectives and stakeholder communication logs

---

# **LO2 – Personal Leadership**

## Description

You independently formulate goals and actions that demonstrate leadership in your own long-term development as an ICT professional. You show that you have a professional attitude and can carry out these actions and achieve your goals, adjusting them as necessary.

## **Further clarification**

Leadership means that you can proactively define your own personal and technical goals and follow-up actions. You reflect on your actions and results, on your own initiative formulate well-defined feedback questions, ask and receive feedback on your goals and actions. You reflect on received feedback and act upon it to improve your work.

A professional attitude is the way you conduct yourself in a professional setting. Common traits associated with a professional attitude are respect, commitment, accountability, and integrity.

For your long-term development you are aware of multiple career paths and can reflect which ones fit best, considering your (potential) skills and ambitions. You know which role you will play in a team. You are aware of developments in the field of software engineering and based on these observations you adjust your personal development plans. The preparing for graduation or finding a minor should be part of your plan (for instance, by finding minors or graduation assignments that fit your ambitions).

## Examples

- Set learning goals - master Kubernetes orchestration, distributed consensus algorithms
- Seek feedback through code reviews with peers and mentors
- Align project with LOs through weekly self-assessments and goal tracking
- Schedule weekly feedback sessions with supervisor and industry professionals

---

# **LO3 – Scalable Architectures**

## Description

Besides functionality, you develop architecture of an enterprise software based on explicitly stated software quality requirements. You explicitly focus on quality requirements most relevant to your projects’ contexts. Quality requirements dictated by law (eg.GDPR) and ethics (eg. security) must always be addressed. You design your system with future adaptation in mind. You assess the extent in which the quality requirements are met by your software implementation.

## **Further clarification**

Software is a composition of the source code, data, infrastructure and runtime. Relevant quality requirements are expressed as non-functional requirements and are directly derived from the project context. Your choice of technologies in the project should fit the non-functional requirements and be supportive for the system architecture realisation.

You investigate architectural patterns that work well in the context of your projects. Your chosen architecture must support verifiably multiple relevant quality requirements as defined in the projects (for instance security, scalability, robustness, performance, availability, responsiveness and accessibility).

## Examples

- Design for horizontal scaling with load balancers (NGINX, HAProxy) and auto-scaling groups
- Microservice architecture - separate services for user management, posts, messaging, notifications
- Implement caching layers (Redis for session data, CDN for media files)
- Ensure GDPR compliance through data anonymization and right-to-deletion APIs
- Document NFRs - target 1000 concurrent users, <200ms response time, 99.9% uptime

---

# **LO4 – Development and Operations (DevOps)**

## Description

You set up environments, tools and processes which support your continuous software development process. Your deployment environment supports this by being able to deploy an integrated software system and monitor the running parts of your application for quality attributes.

## **Further clarification**

Your software is available to developers and other stakeholders during development and in production environment. Your software runs independently from your local host and is presentable to stakeholders on demand. All parts of your software are at all times integrated.

You define environments which will be used by developers in the development and creation of software. These infrastructure environments are defined using ‘Infrastructure as code’ principles and transferrable to the stakeholders.

You chose a deployment strategy to deploy reliably and repeatedly while aiming for a zero downtime in a non-local environment. You support automated testing and measurements which prove the quality of the software (for instance code coverage, security assessment, support for monitoring). You investigate which software performance indicators you will need to collect and monitor those while the software is running. You validate that your application automatically scales under realistic loads and using your performance indicators as measures to confirm it. You automate all the above (for instance using CI/CD principles).

## Examples

- CI/CD pipelines:
    - **Testing pipeline**: Unit tests, integration tests, security scans (SonarQube)
    - **Deployment pipeline**: Blue-green deployments, canary releases
    - **Infrastructure pipeline**: Terraform for IaC, automated environment provisioning
- Containerize distributed components using Docker and Docker Compose
- Implement automated testing across database clusters with test data seeding and cleanup

---

# **LO5 – Cloud Native**

## Description

You develop your software according to the best practices of cloud native development. You deploy (parts of) your application to a cloud platform. You integrate cloud services (for example: Serverless computing, cloud storage, container management) into your software, and can explain the added value of these cloud services for your software quality.

## **Further clarification**

You develop software that is completely or partially composed of cloud services. You investigate what tools, architecture design and best practices you need to follow to develop your software such that it can take full advantage of the cloud native landscape now and in the future. You estimate the total cost of software ownership in the cloud and take precautions to reduce it. In your architectural decisions you discuss the increase of the software qualities caused by using off-the-shelf cloud services and cloud technologies.

## Examples

- Deploy on Kubernetes with managed databases (MongoDB Atlas, Azure Cosmos DB)
- Use serverless functions (Azure Functions, AWS Lambda) for event processing like notifications
- Implement cloud-native monitoring with Prometheus, Grafana, and distributed tracing (Jaeger)
- Utilize service mesh (Istio) for inter-service communication

---

# **LO6 – Security by Design**

## Description

You investigate how to minimize security risks for your application, and you incorporate best practices in your whole software development process.

## **Further clarification**

You investigate which security risks are most common (for instance OWASP top 10) and you investigate which best practices are used to prevent security risks for all steps in your software development process. You create non-functional and functional requirements focused on security. You use common techniques (for instance misuse cases, trust boundaries) in analysis and design of your architecture. You implement common techniques (for instance authentication and authorization) which prevent common security breaches. You also design for, and test steps to mitigate breaches when they still occur.

## Examples

- Apply OWASP top 10 - input validation, SQL injection prevention, XSS protection
- Implement JWT authentication with refresh tokens and rate limiting
- End-to-end encrypt P2P messages using WebRTC with DTLS encryption
- Conduct threat modeling for distributed attack vectors (DDoS, data poisoning, node compromise)
- Introduce OAuth authentication with providers (Google, GitHub, Microsoft)
- Implement API gateway security (rate limiting, API keys, request validation)

---

# **LO7 – Distributed Data**

## Description

You apply best practices for handling and storing large amount of various data types in your software. You use the non-functional requirements of your enterprise software, especially legal and ethical considerations to guide your design choices in protecting and distributing data in your software without compromising other software qualities.

## **Further clarification**

You create non-functional and functional requirements focused on data storage and handling. You thoroughly investigate which data storages are most supportive towards the non-functional requirements of your architecture. You select data storage alternatives based on an estimated data volume, access pattern and data variety. You identify the sensitive data in your software and take precautions to protect it. You apply legal requirements in your design and implementation (for instance GDPR), and you are aware of ethical issues while handling and storing sensitive data.

## Examples

- Implement distributed database using MongoDB Atlas sharded clusters or Cassandra
- Use Redis for distributed caching and session management
- Consider event sourcing with Apache Kafka for audit trails
- Design GDPR-compliant data deletion with distributed transactions and eventual consistency handling
- Implement data replication strategies and backup/disaster recovery procedures