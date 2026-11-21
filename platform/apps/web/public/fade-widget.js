(function () {
  window.FadeWidget = {
    init: function (config) {
      const containerId = config.containerId || 'fade-widget-container';
      const container = document.getElementById(containerId);
      if (!container) return;

      const iframe = document.createElement('iframe');
      const params = new URLSearchParams({
        theme: config.theme || 'light',
        color: config.color || '#111827',
        serviceId: config.serviceId || '',
      });

      iframe.src = (config.baseUrl || 'https://book.fade.com.ua') + '/widget?' + params.toString();
      iframe.style.width = config.width || '100%';
      iframe.style.height = config.height || '500px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';

      window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'FADE_WIDGET_BOOK') {
          if (typeof config.onBook === 'function') {
            config.onBook(event.data);
          }
        }
      });

      container.appendChild(iframe);
    },
  };
})();
