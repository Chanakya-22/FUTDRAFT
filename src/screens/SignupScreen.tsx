import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUpWithEmail } = useAuth();

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await signUpWithEmail(email, password);
    if (signUpError) {
      setError(signUpError.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>CREATE ACCOUNT</Text>
        <Text style={styles.subtitle}>Build your ultimate squad.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#7c7c7c"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#7c7c7c"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </Pressable>

        <Pressable onPress={onNavigateToLogin} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070707' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 2 },
  subtitle: { color: '#b3b3b3', fontSize: 16, marginBottom: 32, textAlign: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: '500' },
  input: { backgroundColor: '#111111', color: '#ffffff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1f1f1f', fontSize: 16 },
  primaryButton: { backgroundColor: '#1f8cff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#1f8cff', fontSize: 14, fontWeight: '600' }
});