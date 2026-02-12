import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './frontend/screens/SplashScreen';
import LoginSelectionScreen from './frontend/screens/LoginSelectionScreen';
import AuthScreen from './frontend/screens/AuthScreen';
import RegisterScreen from './frontend/screens/RegisterScreen';
import StudentDashboard from './frontend/screens/StudentDashboard';
import FacultyDashboard from './frontend/screens/FacultyDashboard';
import CreateElectionScreen from './frontend/screens/CreateElectionScreen';
import AddCandidatesScreen from './frontend/screens/AddCandidatesScreen';
import VotingScreen from './frontend/screens/VotingScreen';
import ElectionResultScreen from './frontend/screens/ElectionResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} />
        <Stack.Screen name="CreateElection" component={CreateElectionScreen} />
        <Stack.Screen name="AddCandidates" component={AddCandidatesScreen} />
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="Results" component={ElectionResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}