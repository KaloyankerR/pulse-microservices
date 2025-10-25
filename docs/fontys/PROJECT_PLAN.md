**Complex Software Systems - Individual Project**

**Fontys University of Applied Sciences**

---

**Date**: September 1, 2025

**Version**: 2.0

**State**: Draft

**Author**: Kaloyan Kulov

---

## Version History

| Version | Date | Author(s) | Changes | State |
| --- | --- | --- | --- | --- |
| 1.0 | Sept 1, 2025 | Kaloyan Kulov | Initial project plan | Draft |
| 2.0 | Sept 1, 2025 | Kaloyan Kulov | Second version project plan | Draft |

---

## Contents

1. Project Assignment
2. Project Organisation
3. Activities and Time Plan
4. Testing Strategy and Configuration Management
5. Finances and Risk

---

## 1. Project Assignment

### 1.1 Context

This project is conducted as part of the Complex Software Systems course at Fontys University of Applied Sciences. The project focuses on developing a modern, enterprise-grade social media platform called "Pulse" that demonstrates complex system architecture, microservices design, and scalability challenges.

The project serves as a practical learning experience in building distributed systems using modern enterprise technologies including Docker, Kubernetes, message brokers, and microservices architecture.

### 1.2 Goal of the Project

**Why**: To gain hands-on experience with complex software architectures and enterprise-level system design while creating a functional social platform that can serve real communities.

**What**: Develop Pulse, a Twitter-like social media platform with enhanced event management capabilities, designed using microservices architecture and modern DevOps practices.

**Advantages**:

- Real-world application of complex system design principles
- Experience with enterprise-grade technologies and infrastructure
- Understanding of scalability challenges and solutions
- Practical knowledge of microservices communication and data consistency

**Value**: The project provides a comprehensive learning experience in enterprise software development while creating a potentially useful platform for student associations and small communities like the Bulgarian Society.

**ICT Product Opportunities**: The platform offers real-time communication, event management, community building features, and demonstrates modern cloud-native architecture patterns.

### 1.3 Scope and Preconditions

**Inside Scope:**

1. Core social media features (posts, comments, likes, following)
2. User authentication and profile management with editing capabilities
3. Real-time messaging system
4. Event management with RSVP functionality
5. Real-time notifications
6. Microservices architecture implementation
7. Docker containerization and Kubernetes orchestration
8. Message broker integration (Kafka/RabbitMQ)
9. Basic frontend interface
10. Testing strategy and implementation

**Outside Scope:**

1. Advanced AI-powered content recommendation or moderation
2. Mobile applications (native iOS/Android)
3. Advanced analytics and reporting dashboards
4. Advanced content moderation beyond basic filtering

**Preconditions:**

- Must use Docker and Kubernetes as per course requirements
- Limited budget - focus on free/open-source technologies
- 18-week timeline constraint
- Access to cloud resources for testing and deployment

### 1.4 Strategy

The project will follow an **Agile/Scrum methodology** with the following approach:

- **Sprint Duration**: 2-week iterations (9 sprints total)
- **Feedback Cycles**: Weekly check-ins with technical teachers for continuous guidance
- **Project Management**: GitHub Issues and Projects for task tracking and progress monitoring
- **Development Approach**: MVP-first strategy, then iterative scaling and enhancement

**Justification**: Agile approach allows for:

- Regular feedback incorporation from supervisors
- Flexible response to technical challenges
- Incremental delivery of working software
- Risk mitigation through early testing and validation
- Adaptation to changing requirements or technical discoveries

**MVP Strategy**: Build initial MVP with core features, test thoroughly, then progressively scale architecture and add advanced features based on lessons learned.

### 1.5 Research Questions and Methodology

**Primary Research Question**: *"How can a social media platform be architected to support scalable growth through microservices design and modern infrastructure practices?"*

**Sub-questions**:

1. What microservices boundaries provide optimal separation of concerns for a social platform?
2. How can real-time features (messaging, notifications) be effectively implemented in a distributed system?
3. What are the trade-offs between different message broker solutions for event-driven architecture?
4. How can containerization and orchestration be leveraged for scalable deployment?

**Methodology (DOT Framework)**:

- **Library Research**: Technology comparison studies, architecture pattern analysis
- **Workshop**: Proof-of-concept implementations, technology spikes
- **Lab**: Performance testing, load testing, integration testing
- **Field Research**: Feedback from potential users (Bulgarian Society members)
- **Showroom**: Regular sprint demos and stakeholder feedback sessions

### 1.6 End Products

**Product Breakdown Structure**:

1. **Project Documentation**
    - Project plan (this document)
    - Architecture documentation
    - API specifications
    - Deployment guides
2. **Research Deliverables**
    - Technology comparison report
    - Architecture decision records (ADRs)
    - Scalability research findings
3. **Software Components**
    - Pulse application (all microservices)
    - Frontend interface
    - Database schemas
    - Docker configurations
    - Kubernetes deployment manifests
4. **Testing Deliverables**
    - Test plans and strategies
    - Automated test suites
    - Performance test results
    - Integration test documentation
5. **Infrastructure**
    - CI/CD pipelines
    - Monitoring and logging setup
    - Deployment environments
6. **Portfolio/Reflection**
    - Learning reflection document
    - Project retrospective
    - Technical challenges and solutions documentation

---

## 2. Project Organisation

### 2.1 Stakeholders and Team Members

| Name | Abbreviation | Role and Functions | Availability |
| --- | --- | --- | --- |
| Frank Schürgers | FS | Semester Coach - Overall project guidance, progress monitoring | Weekly meetings |
| Dennis Cools | DC | Technical Teacher - Technical guidance, architecture review | Weekly consultations |
| Frank Coenen | FC | Technical Teacher - Technical guidance, code review | Weekly consultations |
| Kaloyan Kulov | KK | Developer, Architect, Project Manager | Full-time (40 hours/week) |
| Bulgarian Society Members | BS | End Users, Requirements validation | As needed for feedback |

### 2.2 Communication

**Weekly Technical Meetings**:

- **Goal**: Progress review, technical guidance, problem-solving
- **Attendees**: Student + all teachers
- **Format**: In-person/online, 1-hour sessions
- **Frequency**: Weekly

**Sprint Reviews**:

- **Goal**: Demo working software, gather feedback
- **Attendees**: Student + teachers
- **Format**: Demonstration + discussion
- **Frequency**: Bi-weekly (end of each sprint)

**Documentation Updates**:

- **Goal**: Maintain project transparency
- **Format**: GitHub repository updates, progress reports
- **Frequency**: Continuous

**User Feedback Sessions**:

- **Goal**: Validate requirements and usability
- **Attendees**: Student + Bulgarian Society members
- **Format**: Online demo and feedback collection
- **Frequency**: Monthly or as needed

---

## 3. Activities and Time Plan

### 3.1 Phases of the Project

**Phase 1: Project Setup & Research (Weeks 1-2)**

- Project planning and documentation
- Technology research and selection
- Development environment setup
- Initial architecture design

**Phase 2: MVP Development (Weeks 3-8)**

- Core user management and authentication
- Basic social features (posts, following)
- Simple frontend implementation
- Initial microservices structure

**Phase 3: Advanced Features (Weeks 9-14)**

- Real-time messaging implementation
- Event management system
- Notification service
- Message broker integration

**Phase 4: Scaling & Infrastructure (Weeks 15-17)**

- Kubernetes deployment
- Performance optimization
- Load testing and scaling validation
- Monitoring and logging setup

**Phase 5: Finalization (Week 18)**

- Final testing and bug fixes
- Documentation completion
- Project presentation preparation
- Portfolio development

### 3.2 Time Plan and Milestones

| Sprint | Effort | Start Date | Finish Date | Key Deliverables |
| --- | --- | --- | --- | --- |
| Setup | 2 weeks | Sept 1 | Sept 14 | Project plan, tech stack selection, dev environment |
| Sprint 1 | 2 weeks | Sept 15 | Sept 28 | User service, basic auth, database setup |
| Sprint 2 | 2 weeks | Sept 29 | Oct 12 | Post service, basic frontend, API gateway |
| Sprint 3 | 2 weeks | Oct 13 | Oct 26 | Social features, following system |
| Sprint 4 | 2 weeks | Oct 27 | Nov 9 | Messaging service, real-time communication |
| Sprint 5 | 2 weeks | Nov 10 | Nov 23 | Event management, notification system |
| Sprint 6 | 2 weeks | Nov 24 | Dec 7 | Message broker integration, event-driven architecture |
| Sprint 7 | 2 weeks | Dec 8 | Dec 21 | Kubernetes deployment, containerization |
| Sprint 8 | 2 weeks | Dec 22 | Jan 4 | Performance testing, scaling validation |
| Sprint 9 | 1 week | Jan 5 | Jan 11 | Final testing, documentation, presentation |

---

## 4. Testing Strategy and Configuration Management

### 4.1 Testing Strategy

**Multi-level Testing Approach**:

1. **Unit Testing**
    - Target: 80% code coverage for business logic
    - Tools: JUnit (Java) or Jest (Node.js)
    - Automation: Integrated into CI/CD pipeline
2. **Integration Testing**
    - Service-to-service communication testing
    - Database integration testing
    - API contract testing
3. **System Testing**
    - End-to-end workflow testing
    - Real-time feature testing
    - Performance and load testing
4. **User Acceptance Testing**
    - Usability testing with Bulgarian Society members
    - Feature validation against requirements

**Quality Assurance**:

- SonarQube integration for code quality analysis
- Automated security scanning
- Performance monitoring and alerting

### 4.2 Test Environment and Required Resources

**DTAP Environment Structure**:

```
Development → Testing → Acceptance → Production
     ↓           ↓          ↓           ↓
   Local    →  Docker  → Kubernetes → Cloud Deploy
```

**CI/CD Pipeline**:

- GitHub Actions for automated testing and deployment
- Automated builds on code commits
- Deployment to test environments

**Required Resources**:

- Local development machines
- Cloud resources for testing environments (AWS/Azure free tier)
- Container registry (Docker Hub)
- Monitoring tools (Prometheus/Grafana)

### 4.3 Configuration Management

**Version Control Strategy**:

- **Tool**: Git with GitHub
- **Branching Strategy**: GitFlow
    - `main`: Production-ready code
    - `develop`: Integration branch
    - `feature/*`: Individual feature development
    - `release/*`: Release preparation
    - `hotfix/*`: Emergency fixes

**Change Management**:

- GitHub Issues for feature requests and bug reports
- Pull request reviews for code quality
- Semantic versioning for releases
- Configuration management through environment variables

---

## 5. Finances and Risk

### 5.1 Project Budget

**Budget Approach**: Minimal cost strategy utilizing free and open-source technologies.

**Cost Considerations**:

- Cloud resources: Utilize free tiers (AWS/Azure/GCP)
- Development tools: Free and open-source options
- Hosting: Student accounts or free hosting services
- Total estimated cost: €0-50 for potential cloud overages

**Cost Mitigation**:

- Use local development as much as possible
- Leverage university resources and accounts
- Monitor cloud usage closely
- Use containerization to minimize resource consumption

### 5.2 Risk and Mitigation

| Risk | Likelihood | Impact | Prevention Activities | Mitigation Activities |
| --- | --- | --- | --- | --- |
| Technical complexity overwhelming project scope | High | High | Regular teacher consultation, incremental approach | Reduce scope, focus on MVP, simplify architecture |
| Microservices proving too complex for timeline | Medium | High | Start with monolith, gradual decomposition | Keep services combined if needed, document lessons learned |
| Teacher/supervisor unavailability | Medium | Medium | Regular communication, multiple contact points | Use alternative communication channels, peer consultation |
| Technology learning curve too steep | Medium | High | Early technology spikes, research phase | Focus on familiar technologies, extensive documentation |
| Infrastructure setup consuming too much time | High | Medium | Early setup, incremental deployment | Use simpler deployment options, local development focus |
| Performance requirements not achievable | Low | Medium | Early performance testing, realistic goals | Adjust performance expectations, document constraints |
| User feedback unavailable | Medium | Low | Early stakeholder engagement | Use synthetic user scenarios, teacher feedback |
| Time management and scope creep | High | High | Clear scope definition, regular reviews | Prioritization matrix, feature cutting, scope adjustment |

**Direct Risk Mitigation**:

- Maintain regular communication with all supervisors
- Document all decisions and progress for continuity
- Keep multiple backup plans for critical components
- Focus on learning objectives even if some features are simplified