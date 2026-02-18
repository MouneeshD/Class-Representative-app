# Class-Representative-app

The CR Voting App allows students to vote for class representatives digitally. Faculty members can create elections, add candidates, and track election results. Students can join elections using unique Election ID and cast their votes securely.

Student (Voter) Features
- View active elections
- Join election using Election ID
- Vote for candidates (one vote per student)
- View election results

Faculty (Organizer/Admin) Features
- Create elections with title and maximum voter limit
- Add multiple candidates
- View active elections
- Toggle and view election results

App Architecture
SplashScreen → LoginSelection → AuthScreen/Register → Role-Based Dashboard

Student (Voter)
StudentDashboard → Enter Election ID → VotingScreen → ElectionResultScreen

Faculty (Organizer)
FacultyDashboard → CreateElectionScreen → AddCandidatesScreen → View Results

