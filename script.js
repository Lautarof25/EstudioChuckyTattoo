// ELEMENTS
const track = document.getElementById('carouselTrack');
const items = document.querySelectorAll('.carousel-item');
const mobileMainImg = document.getElementById('mobileMainImg');
const mobileThumbnails = document.getElementById('mobileThumbnails');
const portfolioItems = document.querySelectorAll('.portfolio-item');
const filterBtns = document.querySelectorAll('#portfolio .tab-btn');
const coverupFilterBtns = document.querySelectorAll('#coverup .tab-btn');

let currentMobileIndex = 0;
let isTicking = false;
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false;
let isInitialLoad = true;

// 3D CAROUSEL LOGIC
const updateCarousel = () => {
  if (!track) return;
  const trackWidth = track.offsetWidth;
  const trackCenter = track.scrollLeft + trackWidth / 2;

  items.forEach(item => {
    const itemWidth = item.offsetWidth;
    const itemCenter = item.offsetLeft + itemWidth / 2;
    const dist = itemCenter - trackCenter;
    const maxDist = trackWidth / 1.2;
    let normalized = dist / maxDist;
    const absNorm = Math.abs(normalized);
    const scale = 0.85 + (absNorm * 0.3);
    const rotate = -normalized * 25;
    const translateZ = absNorm * 50;

    item.style.transform = `perspective(1000px) rotateY(${rotate}deg) scale(${scale}) translateZ(${translateZ}px)`;
    item.style.zIndex = Math.round(100 - absNorm * 100);

    const img = item.querySelector('img');
    if (absNorm < 0.15) {
      item.classList.add('active');
      if (img) {
        img.style.borderColor = 'rgba(255, 79, 163, 0.9)';
        img.style.boxShadow = '0 0 40px rgba(255, 79, 163, 0.4)';
      }
    } else {
      item.classList.remove('active');
      if (img) {
        img.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        img.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      }
    }
  });
  isTicking = false;
};

const scrollToItem = (index) => {
  if (!track || index < 0 || index >= items.length) return;
  const item = items[index];
  const scrollPos = item.offsetLeft - (track.offsetWidth / 2) + (item.offsetWidth / 2);
  track.scrollTo({ left: scrollPos, behavior: 'smooth' });
};

const snapToClosest = () => {
  setTimeout(() => {
    let closestIdx = 0;
    let minDiff = Infinity;
    const trackCenter = track.scrollLeft + track.offsetWidth / 2;
    items.forEach((item, idx) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const diff = Math.abs(trackCenter - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    scrollToItem(closestIdx);
  }, 50);
};

// CAROUSEL EVENTS
if (track) {
  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.classList.add('active');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    isDragging = false;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('active');
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('active');
    if (isDragging) snapToClosest();
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    if (Math.abs(e.pageX - track.offsetLeft - startX) > 5) isDragging = true;
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });

  track.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(updateCarousel);
      isTicking = true;
    }
  }, { passive: true });
}

items.forEach((item, index) => {
  item.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    scrollToItem(index);
  });
});

// PORTFOLIO FILTERING
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filterValue = btn.getAttribute('data-filter');

    // Filter desktop grid
    portfolioItems.forEach(item => {
      if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
        item.classList.remove('hidden');
        void item.offsetWidth;
        item.style.animation = 'none';
        setTimeout(() => {
          item.style.animation = 'fadeIn 0.5s ease forwards';
        }, 10);
      } else {
        item.classList.add('hidden');
      }
    });

    // Filter mobile gallery
    if (isMobileView() && mobileThumbnails) {
      currentMobileIndex = 0;
      const visibleItems = Array.from(portfolioItems).filter(item =>
        filterValue === 'all' || item.getAttribute('data-category') === filterValue
      );

      mobileThumbnails.innerHTML = '';
      visibleItems.forEach((item, index) => {
        const img = item.querySelector('img');
        const thumbnail = document.createElement('div');
        thumbnail.className = 'mobile-thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.innerHTML = `<img src="${img.src}" alt="Thumbnail ${index + 1}">`;
        thumbnail.addEventListener('click', () => {
          currentMobileIndex = index;
          const currentVisible = Array.from(mobileThumbnails.querySelectorAll('.mobile-thumbnail'));
          currentVisible.forEach(t => t.classList.remove('active'));
          thumbnail.classList.add('active');
          mobileMainImg.src = img.src;
          mobileMainImg.alt = img.alt;
        });
        mobileThumbnails.appendChild(thumbnail);
      });

      // Update main image to first visible item
      if (visibleItems.length > 0) {
        const firstImg = visibleItems[0].querySelector('img');
        mobileMainImg.src = firstImg.src;
        mobileMainImg.alt = firstImg.alt;
      }
    }
  });
});

// MOBILE GALLERY (PORTFOLIO)
const isMobileView = () => window.innerWidth <= 768;

const updateMobileGallery = () => {
  if (!mobileMainImg || !portfolioItems[currentMobileIndex]) return;
  const currentItem = portfolioItems[currentMobileIndex];
  const img = currentItem.querySelector('img');
  mobileMainImg.src = img.src;
  mobileMainImg.alt = img.alt;

  const thumbnails = mobileThumbnails.querySelectorAll('.mobile-thumbnail');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentMobileIndex);
  });

  const activeThumb = thumbnails[currentMobileIndex];
  if (activeThumb && !isInitialLoad) {
    activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  isInitialLoad = false;
};

const initMobileGallery = () => {
  if (!mobileThumbnails) return;
  mobileThumbnails.innerHTML = '';
  portfolioItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const thumbnail = document.createElement('div');
    thumbnail.className = 'mobile-thumbnail' + (index === currentMobileIndex ? ' active' : '');
    thumbnail.innerHTML = `<img src="${img.src}" alt="Thumbnail ${index + 1}">`;
    thumbnail.addEventListener('click', () => {
      currentMobileIndex = index;
      updateMobileGallery();
    });
    mobileThumbnails.appendChild(thumbnail);
  });
  updateMobileGallery();
};

// LIGHTBOX
const initLightbox = () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const zoomIn = document.getElementById('lightboxZoomIn');
  const zoomOut = document.getElementById('lightboxZoomOut');
  const zoomReset = document.getElementById('lightboxReset');

  let currentScale = 1;
  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;
  let lastTapTime = 0;

  const updateTransform = (smooth = false) => {
    if (smooth) {
      lightboxImg.classList.add('smooth');
    } else {
      lightboxImg.classList.remove('smooth');
    }

    lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;

    // Use a timeout to remove smooth class after transition
    if (smooth) {
      setTimeout(() => {
        lightboxImg.classList.remove('smooth');
      }, 300);
    }

    lightboxImg.classList.toggle('zoomed', currentScale > 1);
  };

  const resetZoom = (smooth = true) => {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform(smooth);
  };

  const openLightbox = (img) => {
    if (!img || !img.src) return;
    resetZoom(false);
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Helper to add click/touch listeners
  const addModalTrigger = (el, getImgEl, condition = () => true) => {
    if (!el) return;

    const handler = (e) => {
      if (!condition()) return;

      // Only stop propagation and open if we're actually going to open it
      e.preventDefault();
      e.stopPropagation();
      const imgToOpen = getImgEl ? getImgEl() : el;
      if (imgToOpen && imgToOpen.src) {
        openLightbox(imgToOpen);
      }
    };

    el.addEventListener('click', handler);

    // Touch handling with scroll detection
    let touchStartY = 0;
    let touchStartX = 0;
    let touchMoved = false;
    const touchThreshold = 10; // pixels of movement to consider it a scroll

    el.addEventListener('touchstart', (e) => {
      if (!condition()) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!condition()) return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = Math.abs(touchX - touchStartX);
      const deltaY = Math.abs(touchY - touchStartY);

      // If moved more than threshold, consider it a scroll
      if (deltaX > touchThreshold || deltaY > touchThreshold) {
        touchMoved = true;
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (!condition()) return;

      // Only open modal if it wasn't a scroll gesture
      if (!touchMoved) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        const imgToOpen = getImgEl ? getImgEl() : el;
        if (imgToOpen && imgToOpen.src) {
          openLightbox(imgToOpen);
        }
      }

      // Reset state
      touchMoved = false;
    }, { passive: false });
  };

  if (lightbox) {
    // 1. Portfolio Grid (Desktop)
    portfolioItems.forEach(item => {
      addModalTrigger(item, () => item.querySelector('img'));
    });

    // 2. Carousel Items (Gallery - Desktop/Mobile)
    const carouselItems = document.querySelectorAll('.carousel-item');
    carouselItems.forEach(item => {
      // Modal should only open if item is active (center)
      addModalTrigger(item, () => item.querySelector('img'), () => item.classList.contains('active'));

      // Ensure cursor is consistent
      const img = item.querySelector('img');
      if (img) img.style.cursor = 'zoom-in';
    });

    // 3. Mobile Portfolio Main Photo
    const mMainImg = document.getElementById('mobileMainImg');
    if (mMainImg) {
      addModalTrigger(mMainImg);

      // Also handle the container to be more touch-friendly
      const mMainPhotoContainer = mMainImg.parentElement;
      if (mMainPhotoContainer) {
        addModalTrigger(mMainPhotoContainer, () => document.getElementById('mobileMainImg'));
      }
    }

    // Close logic
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      resetZoom(false);
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        resetZoom(false);
      }
    });

    // Zoom controls
    zoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentScale = Math.min(currentScale + 0.5, 4);
      updateTransform(true);
    });

    zoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      currentScale = Math.max(currentScale - 0.5, 0.5);
      updateTransform(true);
    });

    zoomReset.addEventListener('click', (e) => {
      e.stopPropagation();
      resetZoom(true);
    });

    // Double tap / click to zoom
    lightboxImg.addEventListener('click', (e) => {
      const currentTime = new Date().getTime();
      const tapDelay = currentTime - lastTapTime;
      if (tapDelay < 300 && tapDelay > 0) {
        if (currentScale > 1) {
          resetZoom(true);
        } else {
          currentScale = 2.5;
          updateTransform(true);
        }
        lastTapTime = 0;
      } else {
        lastTapTime = currentTime;
      }
    });

    // Scroll zoom
    lightboxImg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      const newScale = Math.max(0.5, Math.min(currentScale + delta, 4));
      if (newScale !== currentScale) {
        currentScale = newScale;
        updateTransform(false);
      }
    }, { passive: false });

    // Pan movement (Mouse)
    lightboxImg.addEventListener('mousedown', (e) => {
      if (currentScale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        lightboxImg.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging && currentScale > 1) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform(false);
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (lightboxImg) lightboxImg.style.cursor = currentScale > 1 ? 'grab' : 'pointer';
    });

    // Touch support (Pinch and Pan)
    let touchStartDistance = 0;
    let touchStartScale = 1;

    lightboxImg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        touchStartScale = currentScale;
      } else if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    }, { passive: true });

    lightboxImg.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = (distance / touchStartDistance) * touchStartScale;
        currentScale = Math.max(0.5, Math.min(scale, 4));
        updateTransform(false);
      } else if (e.touches.length === 1 && isDragging && currentScale > 1) {
        e.preventDefault();
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform(false);
      }
    }, { passive: false });

    lightboxImg.addEventListener('touchend', () => {
      isDragging = false;
    });
  }
};

// INFO TABS
const infoTabs = document.querySelectorAll('.info-tab');
const infoPanels = document.querySelectorAll('.info-panel');

infoTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');

    infoTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    infoPanels.forEach(panel => {
      panel.classList.remove('active');
      if (panel.id === targetTab) {
        panel.classList.add('active');
      }
    });
  });
});

// STARS GENERATION
const generateStars = (containerId, count) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(star);
  }
};

// coverup SLIDER & FILTERING
const coverupSlides = document.querySelectorAll('.coverup-slide');
const coverupDotsContainer = document.querySelector('.coverup-dots');
const prevBtnCoverup = document.querySelector('.prev-btn');
const nextBtnCoverup = document.querySelector('.next-btn');
// coverupFilterBtns is already defined above

let currentSlideCoverup = 0;
let visibleSlides = Array.from(coverupSlides).filter(slide => 
  slide.getAttribute('data-category') === 'tapa-tattoo'
);

const showSlideCoverup = (index) => {
  if (visibleSlides.length === 0) return;
  
  // Hide all slides
  coverupSlides.forEach(slide => {
    slide.classList.remove('active');
    slide.style.display = 'none';
  });
  
  const dots = coverupDotsContainer.querySelectorAll('.dot');
  dots.forEach(dot => dot.classList.remove('active'));

  // Show active slide
  const slideToShow = visibleSlides[index];
  if (slideToShow) {
    slideToShow.style.display = 'block';
    void slideToShow.offsetWidth; 
    slideToShow.classList.add('active');
  }
  
  if (dots[index]) {
    dots[index].classList.add('active');
  }
  
  currentSlideCoverup = index;
};

const updateCoverupDots = () => {
  if (!coverupDotsContainer) return;
  coverupDotsContainer.innerHTML = '';
  visibleSlides.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => showSlideCoverup(index));
    coverupDotsContainer.appendChild(dot);
  });
};

const filterCoverupSlides = (category) => {
  visibleSlides = Array.from(coverupSlides).filter(slide => 
    slide.getAttribute('data-category') === category
  );
  
  const sliderContainer = document.querySelector('.coverup-slider-container');
  let noContentMsg = document.getElementById('coverup-no-content');
  
  if (visibleSlides.length === 0) {
    sliderContainer.style.display = 'none';
    if (!noContentMsg) {
      noContentMsg = document.createElement('div');
      noContentMsg.id = 'coverup-no-content';
      noContentMsg.className = 'no-content-message';
      noContentMsg.innerHTML = `
        <div class="coming-soon">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Próximamente</h3>
          <p>Estamos preparando las fotos para esta categoría. ¡Volvé pronto!</p>
        </div>
      `;
      sliderContainer.parentNode.insertBefore(noContentMsg, document.querySelector('.coverup-nav'));
    } else {
      noContentMsg.style.display = 'block';
    }
    document.querySelector('.coverup-nav').style.display = 'none';
  } else {
    sliderContainer.style.display = 'block';
    if (noContentMsg) noContentMsg.style.display = 'none';
    document.querySelector('.coverup-nav').style.display = 'flex';
    updateCoverupDots();
    showSlideCoverup(0);
  }
};

if (prevBtnCoverup && nextBtnCoverup) {
  prevBtnCoverup.addEventListener('click', () => {
    if (visibleSlides.length === 0) return;
    const newIndex = currentSlideCoverup === 0 ? visibleSlides.length - 1 : currentSlideCoverup - 1;
    showSlideCoverup(newIndex);
  });

  nextBtnCoverup.addEventListener('click', () => {
    if (visibleSlides.length === 0) return;
    const newIndex = currentSlideCoverup === visibleSlides.length - 1 ? 0 : currentSlideCoverup + 1;
    showSlideCoverup(newIndex);
  });
}

coverupFilterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    coverupFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterCoverupSlides(btn.getAttribute('data-filter'));
  });
});

// Before/After Slider Drag Functionality
document.querySelectorAll('.before-after-container').forEach(container => {
  const imgAfter = container.querySelector('.img-after');
  const handle = container.querySelector('.slider-handle');

  const updateSlider = (x) => {
    const rect = container.getBoundingClientRect();
    let percentage = ((x - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    imgAfter.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    handle.style.left = `${percentage}%`;
  };

  container.addEventListener('mousedown', (e) => {
    e.preventDefault();
    updateSlider(e.clientX);

    const onMove = (e) => updateSlider(e.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  container.addEventListener('touchstart', (e) => {
    updateSlider(e.touches[0].clientX);

    const onMove = (e) => updateSlider(e.touches[0].clientX);
    const onUp = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  });
});

// INITIALIZATION
window.addEventListener('load', () => {
  // Carousel Init
  setTimeout(() => {
    const startIndex = isMobileView() ? 0 : Math.floor(items.length / 2);
    scrollToItem(startIndex);
    updateCarousel();
  }, 100);

  // Mobile Gallery Init
  if (isMobileView()) {
    initMobileGallery();
  }

  // Lightbox Init
  initLightbox();

  // Coverup Init
  filterCoverupSlides('tapa-tattoo');

  // Stars
  generateStars('stars', 100);
  generateStars('stars-gallery', 80);
  generateStars('stars-info', 50);
  generateStars('stars-testimony', 60);
});

window.addEventListener('resize', () => {
  if (isTicking) return;
  window.requestAnimationFrame(updateCarousel);
  if (isMobileView() && mobileThumbnails && mobileThumbnails.children.length === 0) {
    initMobileGallery();
  }
});

// Close mobile menu
const navToggle = document.getElementById('nav-toggle');
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (navToggle) navToggle.checked = false;
  });
});
