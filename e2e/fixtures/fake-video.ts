export const FAKE_GET_USER_MEDIA = `
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext('2d');
  setInterval(() => {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#7cffb2';
    ctx.fillRect(Math.random()*600, Math.random()*440, 40, 40);
  }, 33);
  const stream = canvas.captureStream(30);
  navigator.mediaDevices.getUserMedia = async () => stream;
})();
`;
