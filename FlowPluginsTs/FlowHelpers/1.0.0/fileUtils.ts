export const getContainer = (filePath: string):string => {
  const parts = filePath.split('.');
  return parts[parts.length - 1];
};

export const getFileName = (filePath: string):string => {
  const parts = filePath.split('/');
  const fileNameAndContainer = parts[parts.length - 1];
  const parts2 = fileNameAndContainer.split('.');
  parts2.pop();
  return parts2.join('.');
};

export const getFfType = (codecType:string):string => (codecType === 'video' ? 'v' : 'a');

export const getSubStem = ({
  inputPathStem,
  inputPath,
}: {
  inputPathStem: string,
  inputPath: string,
}):string => {
  const subStem = inputPath.substring(inputPathStem.length);
  const parts = subStem.split('/');
  parts.pop();

  return parts.join('/');
};
