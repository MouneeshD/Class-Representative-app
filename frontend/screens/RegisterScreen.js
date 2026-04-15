import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DataStore from '../utils/dataStore.js';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function RegisterScreen({ route, navigation }) {
  const { isCompact, formPadding, headerTopPadding } = useResponsiveLayout();
  const { role } = route.params;
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1st Year');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStudent = role === 'student';
  const colors = isStudent
    ? ['#6A1B9A', '#9C27B0']
    : ['#FF6F00', '#FF8F00'];

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !regNo.trim() ||
      !email.trim() ||
      !department.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const success = await DataStore.register({
        regNo: regNo.trim(),
        password: password.trim(),
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
        year: isStudent ? year : null,
      });

      if (success) {
        Alert.alert('Success', 'Registration successful! Please login.');
        navigation.goBack();
      } else {
        Alert.alert(
          'Error',
          isStudent
            ? 'Register number already exists'
            : 'Faculty ID already exists'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[`${colors[0]}10`, '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
        >
          <ScrollView contentContainerStyle={[styles.scrollContent, { padding: formPadding, paddingTop: Math.max(headerTopPadding + 20, 52) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors[0]} />
        </TouchableOpacity>

        <LinearGradient colors={colors} style={styles.iconContainer}>
          <Icon name="account-plus" size={60} color="#FFFFFF" />
        </LinearGradient>

        <Text style={[styles.title, isCompact && styles.titleCompact, { color: colors[0] }]}>Create Account</Text>
        <Text style={styles.subtitle}>Fill in your details to register</Text>

        <View style={[styles.formCard, isCompact && styles.formCardCompact]}>
          <View style={styles.inputContainer}>
            <Icon name="account" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8A8A8A"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="badge-account" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder={isStudent ? 'Register Number' : 'Faculty ID'}
              placeholderTextColor="#8A8A8A"
              value={regNo}
              onChangeText={setRegNo}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder={isStudent ? 'College Email' : 'Official Email'}
              placeholderTextColor="#8A8A8A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="school" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder="Department"
              placeholderTextColor="#8A8A8A"
              value={department}
              onChangeText={setDepartment}
              editable={!loading}
            />
          </View>

          {isStudent && (
            <View style={styles.inputContainer}>
              <Icon name="calendar" size={24} color={colors[0]} />
              <Picker
                selectedValue={year}
                style={styles.picker}
                onValueChange={(itemValue) => setYear(itemValue)}
                enabled={!loading}
              >
                <Picker.Item label="1st Year" value="1st Year" />
                <Picker.Item label="2nd Year" value="2nd Year" />
                <Picker.Item label="3rd Year" value="3rd Year" />
                <Picker.Item label="4th Year" value="4th Year" />
              </Picker>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8A8A8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#999999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-check" size={24} color={colors[0]} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#8A8A8A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#999999"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={colors} style={styles.registerButton}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={[styles.loginLink, { color: colors[0] }]}>
                Login
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  iconContainer: {
    borderRadius: 100,
    padding: 20,
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: { fontSize: 24 },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formCardCompact: { padding: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F1F1F',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#666666',
  },
  loginLink: {
    fontWeight: 'bold',
  },
});
