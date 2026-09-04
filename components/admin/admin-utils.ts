export function makeId(prefix: string) {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`;
}

export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function confirmDelete(label: string) {
  return window.confirm(`确定删除“${label}”吗？此操作会立即写入本地数据。`);
}
