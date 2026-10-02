export function installViewportSizing() {
  const update = () => {
    const viewport = window.visualViewport;
    if (viewport && viewport.scale !== 1) return;
    const height = Math.round(viewport?.height ?? window.innerHeight);
    document.documentElement.style.setProperty('--nova-view-height', `${height}px`);
  };
  update();
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  return () => { window.removeEventListener('resize', update); window.visualViewport?.removeEventListener('resize', update); };
}
