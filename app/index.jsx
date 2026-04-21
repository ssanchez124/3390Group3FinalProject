import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import LinkButton from './LinkButton'
import Bootzie from '../assets/BootSmug.png'

const index = () => {
  return (
    <View style={styles.container}>
    <View style={styles.imageRow}>
      <Image source={Bootzie} style={{ width: 200, height: 200 }} />
    </View>
      <Text style={styles.title}>Workout App {"\n\n"}</Text>
        <LinkButton href="/AiOutput">Ai Output page</LinkButton>
        /*remove this button later when the choices page is done*/
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  imageRow: {
    flexDirection: 'row',      //  puts them side by side
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,                   // spacing between the images
    marginBottom: 20,
  }
})