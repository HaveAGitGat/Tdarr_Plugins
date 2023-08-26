export const getContainer = (filePath: string):string => {
  const parts = filePath.split('.');
  return parts[parts.length - 1];
};

export const getFileName = (filePath: string):string => {
  const parts = filePath.split('/');
  const fileNameAndContainer = parts[parts.length - 1];
  const parts2 = fileNameAndContainer.split('.');
  return parts2[0];
};

export const getFfType = (codecType:string):string => (codecType === 'video' ? 'v' : 'a');
