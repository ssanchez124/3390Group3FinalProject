//This file is used to create a reusable LinkButton component that can be used throughout the app to navigate between different pages. 
// It takes in two props: href, which is the destination URL, and children, which is the text that will be displayed on the button. 
// The component uses the Link component from expo-router to handle navigation and applies some styling to make it look like a button.
import { StyleSheet, View } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'

const LinkButton = ({ href, children }) => {
  return (
    <View style={styles.buttonContainer}>
      <Link href={href} style={styles.linkText}>
      {children}
      </Link>
    </View>
  )
}

export default LinkButton

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    alignSelf: 'center', 
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  }
})
