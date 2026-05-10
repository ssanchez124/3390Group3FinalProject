import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

const SUGGESTIONS = [
  'How do I improve my squat form?',
  'What should I eat after a workout?',
  'How many rest days do I need?',
  'How do I build muscle faster?',
]

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>AI</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <ActivityIndicator size="small" color="#EF88AD" />
      </View>
    </View>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your personal fitness coach. Ask me anything about your workouts, exercise form, nutrition, or recovery — I'll give you advice tailored to you.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [contextOpen, setContextOpen] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const m = user.user_metadata || {}
      if (m.age || m.weight || m.height || m.gender) {
        setProfile({ age: m.age, gender: m.gender, weight_kg: m.weight, height_cm: m.height })
      }
    }
    loadProfile()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMsg = { role: 'user', content }
    const updatedMessages = [...messages, userMsg]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    scrollToBottom()

    try {
      // Only send role/content to the edge function (strip any local-only fields)
      const history = updatedMessages.map(({ role, content }) => ({ role, content }))

      const { data, error } = await supabase.functions.invoke('fitness-chat', {
        body: { messages: history },
      })

      if (error || !data?.reply) throw new Error(error?.message || 'No response')

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't reach the server. Please try again." },
      ])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const showSuggestions = messages.length === 1
  const { bottom } = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
        {/* AI context panel */}
        <TouchableOpacity
          style={styles.contextBar}
          onPress={() => setContextOpen(o => !o)}
          activeOpacity={0.8}
        >
          <Text style={styles.contextBarText}>What the AI knows about you</Text>
          <Text style={styles.contextBarArrow}>{contextOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {contextOpen && (
          <View style={styles.contextPanel}>
            {profile ? (
              <View style={styles.contextChips}>
                <View style={styles.contextChip}><Text style={styles.contextChipText}>🎂 Age: {profile.age}</Text></View>
                <View style={styles.contextChip}><Text style={styles.contextChipText}>⚧ {profile.gender}</Text></View>
                <View style={styles.contextChip}><Text style={styles.contextChipText}>⚖️ {profile.weight_kg} kg</Text></View>
                <View style={styles.contextChip}><Text style={styles.contextChipText}>📏 {profile.height_cm} cm</Text></View>
              </View>
            ) : (
              <Text style={styles.contextEmpty}>No profile found — update it in the Profile tab.</Text>
            )}
            <Text style={styles.contextNote}>
              This is sent to the AI as context so answers are tailored to you. No other data is shared.
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          ListFooterComponent={
            <>
              {loading && <TypingIndicator />}
              {showSuggestions && (
                <View style={styles.suggestions}>
                  <Text style={styles.suggestionsLabel}>Try asking:</Text>
                  <View style={styles.suggestionChips}>
                    {SUGGESTIONS.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={styles.chip}
                        onPress={() => sendMessage(s)}
                      >
                        <Text style={styles.chipText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          }
          onContentSizeChange={scrollToBottom}
        />

        <View style={[styles.inputRow, { paddingBottom: Math.max(bottom, 12) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your fitness coach..."
            placeholderTextColor="rgba(165,56,96,0.5)"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#080005' },
  flex: { flex: 1 },

  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,136,173,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,136,173,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: '#EF88AD' },

  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#EF88AD',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: 'rgba(58,5,25,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(165,56,96,0.3)',
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#080005', fontWeight: '500' },
  bubbleTextAI: { color: 'rgba(255,255,255,0.88)' },

  suggestions: { marginTop: 8, marginBottom: 4 },
  suggestionsLabel: {
    fontSize: 11,
    color: 'rgba(165,56,96,0.6)',
    marginBottom: 8,
    marginLeft: 40,
  },
  suggestionChips: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 40 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(165,56,96,0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(8,0,5,0.45)',
  },
  chipText: { fontSize: 12, color: 'rgba(165,56,96,0.85)', fontWeight: '500' },

  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,56,96,0.15)',
    backgroundColor: 'rgba(58,5,25,0.4)',
  },
  contextBarText: { fontSize: 12, color: 'rgba(165,56,96,0.85)', fontWeight: '600' },
  contextBarArrow: { fontSize: 10, color: '#EF88AD' },
  contextPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(58,5,25,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165,56,96,0.15)',
  },
  contextChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  contextChip: {
    backgroundColor: 'rgba(239,136,173,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,136,173,0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  contextChipText: { fontSize: 12, color: '#EF88AD', fontWeight: '500' },
  contextEmpty: { fontSize: 12, color: 'rgba(165,56,96,0.6)', fontStyle: 'italic', marginBottom: 8 },
  contextNote: { fontSize: 11, color: 'rgba(165,56,96,0.5)', lineHeight: 16 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165,56,96,0.2)',
    backgroundColor: '#080005',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(58,5,25,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(165,56,96,0.35)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF88AD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(239,136,173,0.3)' },
  sendBtnText: { fontSize: 18, color: '#080005', fontWeight: '700' },
})