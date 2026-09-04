'use client';

import { Edit3, ImagePlus, Images, Plus, Save, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import type { Album, Photo } from '@/lib/types';
import { confirmDelete, localToday, makeId } from '@/components/admin/admin-utils';

const emptyAlbum = { id: '', name: '', description: '', coverImage: '/images/content-bg.png' };
const emptyPhoto = { id: '', albumId: '', title: '', description: '', image: '/images/content-bg.png', takenAt: localToday() };

export function AdminGallery() {
  const { data, updateData } = useSiteData();
  const [albumDraft, setAlbumDraft] = useState(emptyAlbum);
  const [photoDraft, setPhotoDraft] = useState(emptyPhoto);

  useEffect(() => {
    if (!photoDraft.albumId && data.albums[0]) setPhotoDraft((current) => ({ ...current, albumId: data.albums[0].id }));
  }, [data.albums, photoDraft.albumId]);

  function saveAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const album: Album = {
      id: albumDraft.id || makeId('album'),
      name: albumDraft.name.trim(),
      description: albumDraft.description.trim(),
      coverImage: albumDraft.coverImage.trim(),
      photos: data.albums.find((item) => item.id === albumDraft.id)?.photos ?? [],
    };
    updateData((current) => ({
      ...current,
      albums: albumDraft.id
        ? current.albums.map((item) => item.id === albumDraft.id ? album : item)
        : [...current.albums, album],
    }));
    setAlbumDraft(emptyAlbum);
    if (!photoDraft.albumId) setPhotoDraft({ ...emptyPhoto, albumId: album.id });
  }

  function savePhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const photo: Photo = {
      id: photoDraft.id || makeId('photo'),
      title: photoDraft.title.trim(),
      description: photoDraft.description.trim(),
      image: photoDraft.image.trim(),
      takenAt: photoDraft.takenAt,
    };
    updateData((current) => ({
      ...current,
      albums: current.albums.map((album) =>
        album.id === photoDraft.albumId
          ? {
              ...album,
              photos: photoDraft.id
                ? album.photos.map((item) => item.id === photoDraft.id ? photo : item)
                : [photo, ...album.photos],
            }
          : album,
      ),
    }));
    setPhotoDraft({ ...emptyPhoto, albumId: photoDraft.albumId });
  }

  function removeAlbum(album: Album) {
    if (!confirmDelete(`${album.name}（含 ${album.photos.length} 张照片）`)) return;
    updateData((current) => ({ ...current, albums: current.albums.filter((item) => item.id !== album.id) }));
    if (photoDraft.albumId === album.id) setPhotoDraft({ ...emptyPhoto, albumId: '' });
  }

  function removePhoto(albumId: string, photo: Photo) {
    if (!confirmDelete(photo.title)) return;
    updateData((current) => ({
      ...current,
      albums: current.albums.map((album) => album.id === albumId ? { ...album, photos: album.photos.filter((item) => item.id !== photo.id) } : album),
    }));
  }

  return (
    <div className="admin-workspace">
      <section className="admin-two-column">
        <form className="admin-panel admin-editor" onSubmit={saveAlbum}>
          <header><div><small>ALBUM</small><h3>{albumDraft.id ? '编辑相册' : '新建相册'}</h3></div><Images /></header>
          <label>相册名称<input required value={albumDraft.name} onChange={(e) => setAlbumDraft({ ...albumDraft, name: e.target.value })} /></label>
          <label>相册介绍<textarea required rows={3} value={albumDraft.description} onChange={(e) => setAlbumDraft({ ...albumDraft, description: e.target.value })} /></label>
          <label>封面地址<input required value={albumDraft.coverImage} onChange={(e) => setAlbumDraft({ ...albumDraft, coverImage: e.target.value })} /></label>
          <footer>{albumDraft.id && <button type="button" className="admin-button-secondary" onClick={() => setAlbumDraft(emptyAlbum)}>取消</button>}<button type="submit" className="admin-button-primary"><Save />保存相册</button></footer>
        </form>

        <form className="admin-panel admin-editor" onSubmit={savePhoto}>
          <header><div><small>PHOTO</small><h3>{photoDraft.id ? '编辑照片' : '添加照片'}</h3></div><ImagePlus /></header>
          <label>所属相册<select required value={photoDraft.albumId} onChange={(e) => setPhotoDraft({ ...photoDraft, albumId: e.target.value })}><option value="">请选择</option>{data.albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}</select></label>
          <div className="admin-form-grid"><label>照片标题<input required value={photoDraft.title} onChange={(e) => setPhotoDraft({ ...photoDraft, title: e.target.value })} /></label><label>拍摄日期<input required type="date" value={photoDraft.takenAt} onChange={(e) => setPhotoDraft({ ...photoDraft, takenAt: e.target.value })} /></label></div>
          <label>图片地址<input required value={photoDraft.image} onChange={(e) => setPhotoDraft({ ...photoDraft, image: e.target.value })} /></label>
          <label>照片描述<textarea required rows={2} value={photoDraft.description} onChange={(e) => setPhotoDraft({ ...photoDraft, description: e.target.value })} /></label>
          <footer>{photoDraft.id && <button type="button" className="admin-button-secondary" onClick={() => setPhotoDraft({ ...emptyPhoto, albumId: photoDraft.albumId })}>取消</button>}<button type="submit" className="admin-button-primary"><Plus />保存照片</button></footer>
        </form>
      </section>

      <section className="admin-panel">
        <header><div><small>GALLERY LIBRARY</small><h3>相册库</h3></div><span>{data.albums.length} 本</span></header>
        <div className="admin-album-list">
          {data.albums.map((album) => (
            <article key={album.id}>
              <header><img src={album.coverImage} alt="" /><div><strong>{album.name}</strong><p>{album.description}</p><small>{album.photos.length} 张照片</small></div><div className="admin-row-actions"><button type="button" onClick={() => setAlbumDraft({ id: album.id, name: album.name, description: album.description, coverImage: album.coverImage })}><Edit3 /></button><button type="button" className="is-danger" onClick={() => removeAlbum(album)}><Trash2 /></button></div></header>
              <div className="admin-photo-strip">
                {album.photos.map((photo) => (
                  <div key={photo.id}><img src={photo.image} alt={photo.title} /><span><strong>{photo.title}</strong><small>{photo.takenAt}</small></span><div><button type="button" onClick={() => setPhotoDraft({ ...photo, albumId: album.id })}><Edit3 /></button><button type="button" onClick={() => removePhoto(album.id, photo)}><Trash2 /></button></div></div>
                ))}
                {album.photos.length === 0 && <p className="admin-empty">这本相册还没有照片。</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
