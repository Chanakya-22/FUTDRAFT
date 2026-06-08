import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Match Engine/App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Something went wrong in the match.</Text>
          <Pressable onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.button}>Return to Lobby</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070707' },
  text: { color: '#fff', fontSize: 18, marginBottom: 20 },
  button: { color: '#1f8cff', fontSize: 16, fontWeight: 'bold' }
});