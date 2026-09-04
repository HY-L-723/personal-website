'use client';

import { CalendarDays, Camera, Images, Maximize2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Photo } from '@/lib/types';
import { cn } from '@/lib/utils';

type SelectedPhoto = { photo: Photo; albumName: string } | null;

export function GalleryPage() {
  const { data } = useSiteData();
  const [activeAlbum, setActiveAlbum] = useState('all');
  const [selected, setSelected] = useState<SelectedPhoto>(null);

  const visibleAlbums = useMemo(
    () =>
      activeAlbum === 'all'
        ? data.albums
        : data.albums.filter((album) => album.id === activeAlbum),
    [activeAlbum, data.albums],
  );
  const totalPhotos = data.albums.reduce(
    (total, album) => total + album.photos.length,
    0,
  );

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · GALLERY"
        title="光影相册"
        description="所有不经意的遇见，都是时光赠予的散文诗。"
        icon={<Camera />}
      />

      <section className="gallery-overview glass-card">
        <div>
          <span className="gallery-overview-icon"><Images /></span>
          <div>
            <strong>{data.albums.length}</strong>
            <span>本相册</span>
          </div>
        </div>
        <div>
          <span className="gallery-overview-icon"><Camera /></span>
          <div>
            <strong>{totalPhotos}</strong>
            <span>张照片</span>
          </div>
        </div>
        <p>把日常里短暂的光，存进不会褪色的格子里。</p>
      </section>

      <nav className="gallery-filters" aria-label="相册筛选">
        <button
          type="button"
          className={cn(activeAlbum === 'all' && 'is-active')}
          onClick={() => setActiveAlbum('all')}
        >
          全部 <span>{totalPhotos}</span>
        </button>
        {data.albums.map((album) => (
          <button
            type="button"
            key={album.id}
            className={cn(activeAlbum === album.id && 'is-active')}
            onClick={() => setActiveAlbum(album.id)}
          >
            {album.name} <span>{album.photos.length}</span>
          </button>
        ))}
      </nav>

      <div className="gallery-albums">
        {visibleAlbums.map((album) => (
          <section key={album.id} className="gallery-album">
            <header>
              <div>
                <span>ALBUM / {String(album.photos.length).padStart(2, '0')}</span>
                <h2>{album.name}</h2>
              </div>
              <p>{album.description}</p>
            </header>
            <div className="gallery-grid">
              {album.photos.map((photo, index) => (
                <button
                  type="button"
                  className={cn('gallery-photo', index % 5 === 0 && 'gallery-photo-wide')}
                  key={photo.id}
                  onClick={() => setSelected({ photo, albumName: album.name })}
                  aria-label={`查看大图：${photo.title}`}
                >
                  <img src={photo.image} alt={photo.title} />
                  <span className="gallery-photo-shade" />
                  <span className="gallery-photo-copy">
                    <small>{album.name}</small>
                    <strong>{photo.title}</strong>
                    <em><CalendarDays />{photo.takenAt}</em>
                  </span>
                  <span className="gallery-photo-expand"><Maximize2 /></span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="gallery-lightbox">
          {selected && (
            <>
              <img src={selected.photo.image} alt={selected.photo.title} />
              <DialogHeader className="gallery-lightbox-copy">
                <span>{selected.albumName}</span>
                <DialogTitle>{selected.photo.title}</DialogTitle>
                <DialogDescription>{selected.photo.description}</DialogDescription>
                <time dateTime={selected.photo.takenAt}>
                  <CalendarDays />拍摄于 {selected.photo.takenAt}
                </time>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ContentShell>
  );
}
