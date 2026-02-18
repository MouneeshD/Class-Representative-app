# Class-Representative-app

The Class Representative Voting App is a full-stack mobile application developed using React Native and Node.js. The system enables secure and structured class representative elections within an academic institution.

The application allows faculty members to create and manage elections while students can securely register, log in, cast votes, and view results. The backend uses MySQL for structured data storage and management.

Features
Student Module

Student Registration

    1.Secure Login
    
    2.View Active Elections
    
    3.Cast Vote (One vote per election)
    
    4.View Election Results

Faculty / Organizer Module

    1.Faculty Login
    
    2.Create New Election
    
    3.Add Candidates
    
    4.Activate or Deactivate Elections
    
    5.View Voting Results

Tech Stack
Frontend

React Native ,Expo ,React Navigation ,Axios

Backend

Node.js ,Express.js ,MySQL ,JWT Authentication

Database

MySQL (Relational Database Management System)

Authentication and Security

    1.Role-based login (Student / Faculty)
    
    2.JWT-based authentication
    
    3.Server-side validation
    
    4.One vote per student per election
    
    5.Secure API endpoints

Database Design Overview

The MySQL database includes the following core tables:
      
      users (student and faculty roles)
      
      elections
      
      candidates
      
      votes

Relationships:

One election has many candidates

One student can vote once per election

Each vote is linked to a specific candidate and election

Application Workflow

    1.Faculty logs in and creates an election.
    
    2.Faculty adds candidates to the election.
    
    3.Election is activated.
    
    4.Students log in and view active elections.
    
    5.Students cast their vote.
    
    6.Results are calculated and displayed.
