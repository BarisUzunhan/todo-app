import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { fetchTodos, addTodo, toggleTodo, deleteTodo, clearDoneTodos } from '../lib/supabase';
import { clearSession } from '../lib/storage';

const FILTERS = [
  { key: 'all',    label: 'Tümü' },
  { key: 'active', label: 'Aktif' },
  { key: 'done',   label: 'Tamamlanan' },
];

export default function TodoScreen({ session, onLogout }) {
  const [todos, setTodos]     = useState([]);
  const [text, setText]       = useState('');
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);

  const token  = session.access_token;
  const userId = session.user?.id || session.user?.sub;

  const load = useCallback(async () => {
    const data = await fetchTodos(token);
    setTodos(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    const t = text.trim();
    if (!t) return;
    setText('');
    setAdding(true);
    const newTodo = await addTodo(token, userId, t);
    if (newTodo) setTodos(prev => [newTodo, ...prev]);
    setAdding(false);
  }

  async function handleToggle(id, done) {
    const updated = await toggleTodo(token, id, done);
    if (updated) setTodos(prev => prev.map(t => t.id === id ? updated : t));
  }

  async function handleDelete(id) {
    await deleteTodo(token, id);
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  async function handleClearDone() {
    await clearDoneTodos(token, userId);
    setTodos(prev => prev.filter(t => !t.done));
  }

  async function handleLogout() {
    await clearSession();
    onLogout();
  }

  const visible = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return t.done;
    return true;
  });

  const activeCount = todos.filter(t => !t.done).length;

  function renderItem({ item }) {
    return (
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleToggle(item.id, item.done)} style={styles.check}>
          <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <Text style={[styles.todoText, item.done && styles.todoTextDone]} numberOfLines={3}>
          {item.text}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Yapılacaklar</Text>
          <Text style={styles.headerEmail} numberOfLines={1}>{session.user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Yeni görev ekle..."
            maxLength={120}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
            {adding
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.addBtnText}>Ekle</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={t => String(t.id)}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>Görev yok</Text>}
            contentContainerStyle={visible.length === 0 && styles.emptyContainer}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{activeCount} görev kaldı</Text>
          <TouchableOpacity onPress={handleClearDone}>
            <Text style={styles.clearText}>Tamamlananları temizle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#4f46e5' },
  flex:            { flex: 1, backgroundColor: '#f0f2f5' },
  header:          { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerEmail:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, maxWidth: 220 },
  logoutBtn:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  logoutText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  inputRow:        { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  input:           { flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: '#1f2937' },
  addBtn:          { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center', minWidth: 56 },
  addBtnText:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  filters:         { flexDirection: 'row', gap: 6, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterBtn:       { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 5 },
  filterBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText:      { fontSize: 13, color: '#6b7280' },
  filterTextActive:{ color: '#fff', fontWeight: '600' },
  row:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  check:           { padding: 2 },
  checkbox:        { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxDone:    { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  checkmark:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  todoText:        { flex: 1, fontSize: 15, color: '#1f2937' },
  todoTextDone:    { textDecorationLine: 'line-through', color: '#9ca3af' },
  deleteBtn:       { padding: 4 },
  deleteText:      { color: '#d1d5db', fontSize: 16 },
  emptyContainer:  { flex: 1 },
  empty:           { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 14 },
  footer:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  footerText:      { fontSize: 12, color: '#9ca3af' },
  clearText:       { fontSize: 12, color: '#ef4444' },
});
