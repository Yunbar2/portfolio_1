const localNavigation = [...document.querySelectorAll('.nav-inner a[data-section]')];
const isDetail = document.body.classList.contains('detail-page');

function markActive(links, activeId, attribute) {
  for (const link of links) {
    const active = link.getAttribute(attribute) === activeId;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function trackSections(sections, links, attribute, offset) {
  let scheduled = false;
  const update = () => {
    let active = sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset()) active = section.id;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      active = sections.at(-1)?.id;
      const linkedSection = sections.find(section => '#' + section.id === window.location.hash);
      const linkedBounds = linkedSection?.getBoundingClientRect();
      if (linkedBounds && linkedBounds.bottom > offset() && linkedBounds.top < window.innerHeight) {
        active = linkedSection.id;
      }
    }
    if (active) markActive(links, attribute === 'href' ? '#' + active : active, attribute);
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  window.addEventListener('hashchange', update);
  update();
}

const headerOffset = () => document.querySelector('.site-header').offsetHeight + 110;
if (!isDetail) {
  const sections = localNavigation.map(link => document.getElementById(link.dataset.section)).filter(Boolean);
  trackSections(sections, localNavigation, 'data-section', headerOffset);
}

const tocLinks = [...document.querySelectorAll('.case-nav a')];
if (tocLinks.length) {
  const sections = tocLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  trackSections(sections, tocLinks, 'href', headerOffset);
  tocLinks.forEach(link => {
    link.addEventListener('click', () => markActive(tocLinks, link.getAttribute('href'), 'href'));
  });
}

const imageModal = document.querySelector('.image-modal');
if (imageModal) {
  const modalImage = imageModal.querySelector('.image-modal-image');
  const caption = imageModal.querySelector('.image-modal-caption');
  let openedFrom = null;

  document.querySelectorAll('.case-images img').forEach(image => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'case-image-button';
    button.setAttribute('aria-label', image.alt + ' 확대 보기');
    button.setAttribute('aria-haspopup', 'dialog');
    image.replaceWith(button);
    button.append(image);
    button.addEventListener('click', () => {
      openedFrom = button;
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      caption.textContent = image.alt;
      imageModal.showModal();
      document.documentElement.classList.add('image-modal-open');
    });
  });

  imageModal.querySelector('.image-modal-close').addEventListener('click', () => imageModal.close());
  imageModal.addEventListener('click', event => {
    if (event.target === imageModal) imageModal.close();
  });
  imageModal.addEventListener('close', () => {
    document.documentElement.classList.remove('image-modal-open');
    modalImage.removeAttribute('src');
    modalImage.alt = '';
    caption.textContent = '';
    openedFrom?.focus({ preventScroll: true });
    openedFrom = null;
  });
}

const resumeButton = document.querySelector('[data-resume-pdf]');
resumeButton?.addEventListener('click', async () => {
  const status = document.querySelector('#resume-status');
  try {
    const url = new URL(resumeButton.dataset.resumePdf, document.baseURI);
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
      window.location.assign(url);
      return;
    }
    status.textContent = '이력서 PDF는 추가 예정입니다.';
  } catch {
    status.textContent = '이력서 파일을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
});

document.querySelectorAll('[data-unavailable]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.media-status').textContent = button.dataset.unavailable;
  });
});
