# Week 5 Progress Report

**Date:** 04.10.2025

**Student Name:** Kaloyan Kulov

---

## Introduction

This reflection document covers my progress through week 5 of the Complex Software Systems semester, during which I have been engaged in both individual and group project work. The purpose of this reflection is to assess my progress toward achieving the seven learning outcomes, identify areas of strength and growth, and provide an honest self-assessment of my current competency level.

---

## Project Context

**Individual Project:** Twitter Clone using microservices architecture

**Group Project:** SUE's vibe coding improver platform (using LangChain)

---

## Learning Outcome Reflections & Self-Assessment

### Learning Outcome 1: Professional Standard

**Evidence of Achievement:**

I have established a consistent professional routine, attending university punctually for group standups and teacher feedback sessions. For our team project, I set up structured communication channels including a Discord server for team discussions and Jira for project management and task tracking.

In the group project, I took responsibility as the primary stakeholder contact person. This involves scheduling meetings through Google Calendar invitations and sending detailed meeting notes afterward to ensure clear communication and documentation of decisions.

Given the substantial workload this semester, I have adopted a strategy of breaking work into smaller, manageable tasks to maintain productivity and progress across both projects.

I conducted formal research using the DOT framework for my individual project, specifically investigating technology stack options and repository structure strategies. These are documented in my Tech Stack Research and Repository Structure Research files.

**Areas for Growth:**

- Prepare formal agendas for all meetings, whether with teachers or stakeholders
- Create comprehensive research documents for additional technical decisions (database selection, service brokers, authentication strategies, API gateways)
- Improve documentation of ethical and legal considerations in project decisions

**Self-Grade: Orienting**

**Justification:** I am actively exploring professional practices and maintaining conscientious work habits. I have established foundational processes for communication and research, though I recognize the need to formalize and document more aspects of my decision-making process.

---

### Learning Outcome 2: Personal Leadership

**Evidence of Achievement:**

I maintain a daily task planning system to organize my workload effectively. By breaking larger objectives into smaller, actionable tasks, I can maintain consistent productivity and visibly track progress over time. This approach helps me balance the demands of both individual and group projects while pursuing high-quality outcomes.

**Areas for Growth:**

- Develop a better system to document and showcase the incremental progress and small achievements throughout the project lifecycle
- Set more explicit, measurable goals for my professional development
- Reflect more regularly on adjustments made to goals and strategies

**Self-Grade: Orienting**

**Justification:** I demonstrate conscientiousness and commitment to achieving outstanding results. However, I am still developing systems to better articulate and evidence my leadership journey and goal-setting processes.

---

### Learning Outcome 3: Scalable Architectures

**Evidence of Achievement:**

I designed my system architecture using the C4 model approach, creating comprehensive diagrams that visualize all components and their relationships. These diagrams are documented in my Architecture document and have been reviewed during feedback sessions with Dennis and Frank. I incorporated their suggestions, which are reflected in the feedpulse documentation.

My microservices architecture is designed with scalability in mind, separating concerns across multiple services that can be independently developed and scaled.

**Areas for Growth:**

- Address deployment considerations and infrastructure design
- Integrate CI/CD pipeline planning into architectural decisions
- Define testing strategy including unit tests, integration tests, and load testing
- Provide more detailed documentation explaining the purpose and responsibilities of each microservice
- Explicitly document quality requirements and how they drive architectural choices

**Self-Grade: Orienting**

**Justification:** Architecture has been a primary focus during these initial weeks, which is appropriate for the project phase. The feedback sessions with Frank and Dennis have centered on architectural decisions, indicating this is where I've invested significant effort. However, I need to expand my focus to include operational and quality assurance aspects.

---

### Learning Outcome 4: Development and Operations (DevOps)

**Evidence of Achievement:**

I have established a development environment with Docker containerization for each microservice, ensuring consistency and portability. My setup includes:

- Individual Dockerfiles for every microservice
- Git repository with proper version control
- CI/CD pipelines using a matrix strategy to handle multiple microservices
- Docker Compose configuration for local orchestration and testing
- Automated build steps in the pipeline for all microservices

**Areas for Growth:**

- Refine the CI/CD pipeline for better efficiency and clarity
- Implement automated test execution and code coverage reporting in the pipeline
- Add deployment stages to the pipeline
- Integrate monitoring and logging tools

**Self-Grade: Orienting**

**Justification:** I am making solid progress in setting up DevOps infrastructure and balancing feature integration with service development. While the foundation is in place, the pipeline and automation processes need further development and refinement.

---

### Learning Outcome 5: Cloud Native

**Evidence of Achievement:**

I have applied containerization principles using Docker for all microservices and Docker Compose for local orchestration. This represents the foundation of cloud-native development, though currently focused on local testing environments.

**Areas for Growth:**

- Plan and implement cloud deployment strategy
- Explore and integrate cloud services such as serverless functions, managed databases, or container orchestration platforms
- Investigate cloud-native patterns like service discovery, circuit breakers, and distributed tracing
- Document the added value of cloud services for the project

**Self-Grade: Orienting**

**Justification:** Working with Docker in a microservices context has been challenging but valuable for developing DevOps skills and refreshing cloud knowledge. However, actual cloud deployment and integration of cloud services remains to be addressed in the coming weeks.

---

### Learning Outcome 6: Security by Design

**Evidence of Achievement:**

I have implemented foundational security practices throughout my system:

- Password hashing for secure credential storage in the database
- JWT-based authentication system
- Inter-service authentication requiring valid JWT tokens from the user-service
- Authorization checks ensuring services cannot function without proper authentication

This approach creates a security layer across the entire backend, preventing unauthorized access at the service level.

**Areas for Growth:**

- Create detailed research documents explaining security implementation choices
- Implement additional security measures (input validation, rate limiting, CORS configuration)
- Conduct threat modeling for the system
- Document GDPR compliance considerations

**Self-Grade: Orienting**

**Justification:** I have established core security mechanisms focusing on authentication and authorization. These foundational practices demonstrate security awareness, though more comprehensive security research and documentation is needed.

---

### Learning Outcome 7: Distributed Data

**Evidence of Achievement:**

My system employs a polyglot persistence approach using two database technologies:

- PostgreSQL for relational data requiring ACID properties
- MongoDB for flexible, document-based storage

After conducting initial research, I determined these databases are appropriate for different aspects of my Twitter clone project, with each serving distinct data storage needs.

**Areas for Growth:**

- Document the research process and rationale for database selection decisions
- Implement database security measures (encryption at rest, access controls, backup strategies)
- Address data consistency patterns across microservices
- Consider GDPR compliance for data protection and user privacy

**Self-Grade: Orienting**

**Justification:** I have made informed decisions about data storage technologies appropriate to different service requirements. However, documentation of the decision-making process and implementation of data protection measures need significant development.

---

## Overall Reflection

**Strengths:**

- Successfully explored microservices architecture and gained practical experience with distributed system challenges
- Established professional communication practices and took leadership as stakeholder contact
- Built a solid technical foundation with Docker, CI/CD, and multiple technology stacks

**Challenges:**

- Configuring the API gateway to provide a unified entry point for all services
- Implementing cross-service authentication using shared JWT tokens
- Setting up Docker containers and orchestrating them with Docker Compose in a microservices environment

**Goals for Next Week:**

1. Continue development of remaining microservices
2. Research and begin implementation of monitoring and logging tools
3. Start documenting technical decisions in comprehensive research documents
4. Begin planning cloud deployment strategy

**Overall Self-Assessment: Orienting**

---

## Conclusion

By week 5, I have built a solid foundation for understanding complex software systems, particularly in microservices architecture and DevOps practices. While I have made progress across all learning outcomes, I recognize that continued growth is needed, particularly in cloud deployment, comprehensive documentation, and security hardening. I am committed to addressing these areas in the coming weeks through focused effort on deployment, monitoring, and thorough documentation of my technical decisions and their justifications.