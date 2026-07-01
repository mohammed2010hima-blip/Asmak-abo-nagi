// مكتبة رسوم بيانية مصغرة مخصصة ومبنية بالكامل على Canvas
// تدعم الرسم المتحرك للمخططات الخطية (Line)، الأعمدة (Bar)، والدائرية (Doughnut)

class CustomCharts {
  static drawLineChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // التعامل مع شاشات ريتنا بدقة عالية
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 100) * 1.1; // 10% هامش علوي
    const minVal = 0;

    let animationProgress = 0;
    const animate = () => {
      if (animationProgress < 1) {
        animationProgress += 0.05;
        requestAnimationFrame(animate);
      } else {
        animationProgress = 1;
      }
      
      ctx.clearRect(0, 0, width, height);

      // رسم خطوط المساعدة الأفقية والقيم Y
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#e2e8f0';
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#64748b';
      ctx.font = "10px Cairo";
      ctx.textAlign = "left";
      ctx.lineWidth = 1;

      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding + (chartHeight / gridLines) * i;
        const val = maxVal - ((maxVal - minVal) / gridLines) * i;
        
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.fillText(Math.round(val) + " ج.م", 5, y + 3);
      }

      // رسم الأسماء على محور X
      ctx.textAlign = "center";
      const stepX = chartWidth / (labels.length - 1 || 1);
      labels.forEach((label, index) => {
        const x = padding + index * stepX;
        ctx.fillText(label, x, height - padding + 15);
      });

      // رسم خط البيانات مع الأنيميشن
      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#e05a36';
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";

      data.forEach((val, index) => {
        const x = padding + index * stepX;
        const ratio = (val - minVal) / (maxVal - minVal);
        // احتساب الحركة (الأنيميشن)
        const y = height - padding - chartHeight * ratio * animationProgress;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // تعبئة المساحة تحت المنحنى
      ctx.lineTo(padding + (data.length - 1) * stepX, height - padding);
      ctx.lineTo(padding, height - padding);
      const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      gradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--primary-glow').trim() || 'rgba(224, 90, 54, 0.3)');
      gradient.addColorStop(1, 'rgba(224, 90, 54, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // رسم نقاط التحديد
      data.forEach((val, index) => {
        const x = padding + index * stepX;
        const ratio = (val - minVal) / (maxVal - minVal);
        const y = height - padding - chartHeight * ratio * animationProgress;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#e05a36';
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    };

    animate();
  }

  static drawBarChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 10) * 1.1;
    const minVal = 0;

    let animationProgress = 0;
    const animate = () => {
      if (animationProgress < 1) {
        animationProgress += 0.05;
        requestAnimationFrame(animate);
      } else {
        animationProgress = 1;
      }

      ctx.clearRect(0, 0, width, height);

      // رسم شبكة المحور Y
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#e2e8f0';
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#64748b';
      ctx.font = "10px Cairo";
      ctx.textAlign = "left";
      ctx.lineWidth = 1;

      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding + (chartHeight / gridLines) * i;
        const val = maxVal - ((maxVal - minVal) / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillText(Math.round(val), 5, y + 3);
      }

      // رسم الأعمدة
      const barCount = labels.length;
      const barSpacing = chartWidth / barCount;
      const barWidth = barSpacing * 0.6; // يشغل 60% من المساحة

      ctx.textAlign = "center";
      labels.forEach((label, index) => {
        const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
        ctx.fillText(label, x + barWidth / 2, height - padding + 15);
      });

      data.forEach((val, index) => {
        const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
        const ratio = val / maxVal;
        const barH = chartHeight * ratio * animationProgress;
        const y = height - padding - barH;

        // تدرج لوني لكل عمود
        const grad = ctx.createLinearGradient(x, y, x, height - padding);
        grad.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--secondary-color').trim() || '#0d9488');
        grad.addColorStop(1, getComputedStyle(document.body).getPropertyValue('--secondary-glow').trim() || 'rgba(13, 148, 136, 0.2)');

        ctx.fillStyle = grad;
        // رسم عمود بحواف مستديرة علوية
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]) : ctx.rect(x, y, barWidth, barH);
        ctx.fill();
      });
    };

    animate();
  }

  static drawDoughnutChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    const total = data.reduce((acc, val) => acc + val, 0) || 1;
    
    // ألوان جذابة
    const colors = [
      getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#e05a36',
      getComputedStyle(document.body).getPropertyValue('--secondary-color').trim() || '#0d9488',
      '#10b981',
      '#f59e0b',
      '#3b82f6',
      '#8b5cf6'
    ];

    let animationProgress = 0;
    const animate = () => {
      if (animationProgress < 1) {
        animationProgress += 0.05;
        requestAnimationFrame(animate);
      } else {
        animationProgress = 1;
      }

      ctx.clearRect(0, 0, width, height);

      let startAngle = -Math.PI / 2;

      data.forEach((val, index) => {
        const sliceAngle = (val / total) * Math.PI * 2 * animationProgress;

        // رسم الجزء
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, radius * 0.6, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        startAngle += sliceAngle;
      });

      // رسم دليل الألوان أسفل أو بجانب الرسم
      // للحفاظ على البساطة، سنرسمها في الزوايا إذا لزم الأمر أو نعرضها بنصوص HTML
    };

    animate();
  }
}

window.CustomCharts = CustomCharts;
