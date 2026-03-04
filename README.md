Database Systems – Assignment 2
SQL Query Design & Implementation Report


 Movie Ticket Booking System – Database Implementation

A relational database project built using Microsoft SQL Server that simulates a real-world cinema ticket booking system with transaction handling, business constraints, and loyalty point management.

Developed as part of the Database Systems course project.

Project Overview

This project implements the backend database layer of a movie ticket booking system.
It focuses on:

Relational schema design

Business rule enforcement at the database level

Transaction consistency

Prevention of double booking

Loyalty point calculation automation

The system models real-world cinema operations including theaters, movies, showtimes, seats, transactions, vouchers, and customers.

Database Design
Core Entities

Account

Customer

Staff

Theater

Screening Room

Movie

Showtime

Seat

Ticket

Transaction

Promotion / Voucher

Loyalty Point History

The schema is designed with:

Primary Keys

Foreign Keys

CHECK constraints

UNIQUE constraints

Triggers for business logic

Stored Procedures for CRUD operations

Business Logic Implemented at Database Layer
Double Booking Prevention

A trigger ensures that:

A seat cannot be booked more than once for the same showtime

Conflicting inserts are automatically rejected

Transaction is rolled back if violation occurs

This guarantees data consistency even under concurrent booking attempts.

Automated Loyalty Point System

When a transaction status changes to "Successful":

Loyalty points are automatically calculated

Points are updated in real-time

History of point changes is recorded

No application-layer logic required.

Controlled Deletion with Referential Integrity

Stored procedures validate:

A theater cannot be deleted if related rooms, seats, or showtimes exist

Data integrity is preserved before destructive operations

Technologies Used

Microsoft SQL Server

T-SQL

Stored Procedures

Triggers

Cursors

Relational Data Modeling (ERD)

Project Structure
/database
    ├── create_tables.sql
    ├── insert_sample_data.sql
    ├── stored_procedures.sql
    ├── triggers.sql
    ├── functions.sql
    └── test_queries.sql

/report
    └── Full_Project_Report.pdf

How to Run

Open SQL Server Management Studio (SSMS)

Create a new database

Run scripts in the following order:

create_tables.sql

insert_sample_data.sql

stored_procedures.sql

triggers.sql

functions.sql

Execute test_queries.sql to verify functionality

Sample Features Demonstrated

CRUD operations via Stored Procedures

JOIN-based reporting queries

Aggregation and statistical queries

Cursor-based calculations

Transaction validation

Derived attribute automation

Real-time seat availability control

Performance & Integrity Considerations

Referential integrity strictly enforced

CHECK constraints prevent invalid data

Triggers handle complex cross-table validation

Schema normalized to reduce redundancy

Future optimization may include:

Indexing strategy improvements

Isolation level tuning for concurrency control

Performance benchmarking

Key Learning Outcomes

Translating business requirements into relational models

Implementing real-world constraints in SQL Server

Designing systems with transactional consistency

Understanding database-layer responsibility in fullstack systems

Applying database logic to support scalable applications

Notes
---
This project is for academic purposes.

The dataset used is for demonstration and testing only.

All SQL queries are written to ensure clarity and correctness.
