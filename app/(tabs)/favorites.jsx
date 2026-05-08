import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async (manual = false) => {
    try {
      if (manual) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRefetching(false);
    }
  };

  const removeFavorite = async (id) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      Alert.alert('Delete Failed', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{item.exercise_name}</Text>
          <Text style={styles.muscleGroup}>{item.muscle_group}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.removeBtn} 
          onPress={() => removeFavorite(item.id)}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.sets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.reps}</Text>
          <Text style={styles.statLabel}>Reps</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.rest_seconds}s</Text>
          <Text style={styles.statLabel}>Rest</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.difficulty}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {item.instructions && (
        <Text style={styles.instructions} numberOfLines={3}>
          {item.instructions}
        </Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EF88AD" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorite Exercises</Text>
        
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={() => fetchFavorites(true)} 
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#EF88AD" />
          ) : (
            <Text style={styles.refreshBtnText}>↻ Reload</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchFavorites();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No favorites saved yet.</Text>
            <Text style={styles.emptySubtext}>Tap the star on an exercise to save it here!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#080005' },
  centered: { flex: 1, backgroundColor: '#080005', justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165, 56, 96, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.4)',
    minWidth: 80,
    alignItems: 'center'
  },
  refreshBtnText: { 
    color: '#EF88AD', 
    fontWeight: '700', 
    fontSize: 13 
  },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.3)',
    overflow: 'hidden',
  },
  cardSheen: {
    position: 'absolute',
    top: 0, left: 16, right: 16, height: 1,
    backgroundColor: 'rgba(239, 136, 173, 0.28)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  muscleGroup: { fontSize: 12, color: '#EF88AD', fontWeight: '600', textTransform: 'capitalize' },
  
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,115,115,0.4)',
    backgroundColor: 'rgba(229,115,115,0.05)',
  },
  removeText: { color: '#e57373', fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 0, 5, 0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(165,56,96,0.2)',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#EF88AD' },
  statLabel: { fontSize: 10, color: 'rgba(165,56,96,0.7)', marginTop: 2 },

  instructions: { fontSize: 13, color: 'rgba(165,56,96,0.75)', lineHeight: 18 },

  emptyContainer: { marginTop: 100, alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { color: 'rgba(165,56,96,0.7)', textAlign: 'center', lineHeight: 20 },
});

export default Favorites;