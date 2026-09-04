'use client';

import { Database, Download, FileJson, HardDrive, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';

export function AdminData() {
  const { data, exportData, importData, resetData } = useSiteData();
  const [notice, setNotice] = useState('');
  const size = Math.max(1, Math.round(new Blob([JSON.stringify(data)]).size / 1024));
  const itemCount = data.posts.length + data.moments.length + data.albums.reduce((sum, album) => sum + album.photos.length, 0) + data.friendLinks.length + data.guestbook.length;

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importData(await file.text());
      setNotice(`已导入 ${file.name}，所有页面会立即使用新数据。`);
    } catch (error) {
      setNotice(error instanceof Error ? `导入失败：${error.message}` : '导入失败：文件格式不正确。');
    }
    event.target.value = '';
  }

  function reset() {
    if (!window.confirm('确定恢复示例初始数据吗？当前浏览器中的所有修改都会被覆盖。建议先导出备份。')) return;
    resetData();
    setNotice('已恢复初始数据。');
  }

  return (
    <div className="admin-workspace">
      <section className="admin-data-hero">
        <div><span>LOCAL DATA CENTER</span><h2>数据由你掌握</h2><p>当前版本不依赖数据库。文章、留言和设置都存储在浏览器 localStorage 中，可随时导出一份完整 JSON 备份。</p></div>
        <Database />
      </section>

      <section className="admin-metric-grid admin-data-metrics">
        <div><i><HardDrive /></i><span><small>存储方式</small><strong>localStorage</strong><em>当前浏览器</em></span></div>
        <div><i><FileJson /></i><span><small>数据版本</small><strong>v{data.version}</strong><em>JSON 结构</em></span></div>
        <div><i><Database /></i><span><small>内容条目</small><strong>{itemCount}</strong><em>约 {size} KB</em></span></div>
      </section>

      {notice && <div className="admin-data-notice" role="status"><ShieldCheck />{notice}</div>}

      <section className="admin-data-actions">
        <article className="admin-panel">
          <i><Download /></i><div><small>BACKUP</small><h3>导出完整备份</h3><p>下载包含资料、文章、相册、友链、留言、统计等全部数据的 JSON 文件。</p></div>
          <button type="button" className="admin-button-primary" onClick={() => { exportData(); setNotice('备份文件已开始下载。'); }}><Download />导出 JSON</button>
        </article>
        <article className="admin-panel">
          <i><Upload /></i><div><small>RESTORE</small><h3>导入已有备份</h3><p>导入会用备份内容覆盖当前数据。仅接受由本站导出的有效 JSON。</p></div>
          <label className="admin-button-primary"><Upload />选择 JSON<input type="file" accept="application/json,.json" onChange={handleImport} /></label>
        </article>
        <article className="admin-panel admin-danger-zone">
          <i><RotateCcw /></i><div><small>DANGER ZONE</small><h3>恢复初始数据</h3><p>清除所有本地修改，并重新载入项目内置的示例内容。</p></div>
          <button type="button" onClick={reset}><RotateCcw />恢复初始值</button>
        </article>
      </section>

      <section className="admin-panel admin-migration-note">
        <ShieldCheck />
        <div><h3>为数据库阶段保留的迁移路径</h3><p>前台与后台都通过统一 Repository 接口访问数据。后续只需新增远程数据仓库实现，即可替换 localStorage，无需重写页面。</p></div>
      </section>
    </div>
  );
}
