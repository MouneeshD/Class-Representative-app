import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import LoginSelectionScreen from './screens/LoginSelectionScreen';
import AuthScreen from './screens/AuthScreen';
import RegisterScreen from './screens/RegisterScreen';
import StudentDashboard from './screens/StudentDashboard';
import FacultyDashboard from './screens/FacultyDashboard';
import ProfileScreen from './screens/ProfileScreen';
import StudentMyElectionsScreen from './screens/StudentMyElectionsScreen';
import FacultyMyElectionsScreen from './screens/FacultyMyElectionsScreen';
import FacultyElectionActionsScreen from './screens/FacultyElectionActionsScreen';
import CreateElectionScreen from './screens/CreateElectionScreen';
import AddCandidatesScreen from './screens/AddCandidatesScreen';
import VotingScreen from './screens/VotingScreen';
import ElectionResultScreen from './screens/ElectionResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
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
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="StudentMyElections" component={StudentMyElectionsScreen} />
            <Stack.Screen name="FacultyMyElections" component={FacultyMyElectionsScreen} />
            <Stack.Screen name="FacultyElectionActions" component={FacultyElectionActionsScreen} />
            <Stack.Screen name="CreateElection" component={CreateElectionScreen} />
            <Stack.Screen name="AddCandidates" component={AddCandidatesScreen} />
            <Stack.Screen name="Voting" component={VotingScreen} />
            <Stack.Screen name="Results" component={ElectionResultScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

