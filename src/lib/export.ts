import html2canvas from 'html2canvas';

export const exportAsImage = async (element: HTMLElement, fileName: string, format: 'png' | 'jpeg') => {
  document.body.classList.add('exporting');
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
  });
  document.body.classList.remove('exporting');

  const image = canvas.toDataURL(`image/${format}`, 1.0);

  const link = document.createElement('a');
  link.href = image;
  link.download = `${fileName}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
