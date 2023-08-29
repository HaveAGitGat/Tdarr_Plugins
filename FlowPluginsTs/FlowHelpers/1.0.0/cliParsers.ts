const handbrakeParser = ({
  str,
}:
  {
    str: string
  }): number => {
  if (typeof str !== 'string') {
    return 0;
  }

  let percentage = 0;
  const numbers = '0123456789';
  const n = str.indexOf('%');

  if (
    str.length >= 6
    && str.indexOf('%') >= 6
    && numbers.includes(str.charAt(n - 5))
  ) {
    let output: string = str.substring(n - 6, n + 1);
    const outputArr: string[] = output.split('');
    outputArr.splice(outputArr.length - 1, 1);
    output = outputArr.join('');

    const outputNum = Number(output);
    if (outputNum > 0) {
      percentage = outputNum;
    }
  }

  return percentage;
};

// frame=  889 fps=106 q=26.0 Lsize=   25526kB time=00:00:35.69 bitrate=5858.3kbits/s speed=4.25x
const getFFmpegVar = ({
  str,
  variable,
}: {
  str: string, variable: string
}): string => {
  if (typeof str !== 'string') {
    return '';
  }

  const idx = str.indexOf(variable);

  let out = '';
  let initSpacesEnded = false;

  if (idx >= 0) {
    const startIdx = idx + variable.length + 1;
    for (let i = startIdx; i < str.length; i += 1) {
      if (initSpacesEnded === true && str[i] === ' ') {
        break;
      } else if (initSpacesEnded === false && str[i] !== ' ') {
        initSpacesEnded = true;
      }

      if (initSpacesEnded === true && str[i] !== ' ') {
        out += str[i];
      }
    }
  }

  return out;
};

const getFFmpegPercentage = ({
  f,
  fc,
  vf,
  d,
}: {

  f: string, fc: number, vf: number, d: number
}): number => {
  let frameCount01: number = fc;
  let VideoFrameRate: number = vf;
  let Duration: number = d;

  let perc = 0;

  const frame: number = parseInt(f, 10);
  frameCount01 = Math.ceil(frameCount01);
  VideoFrameRate = Math.ceil(VideoFrameRate);
  Duration = Math.ceil(Duration);

  if (frameCount01 > 0) {
    perc = ((frame / frameCount01) * 100);
  } else if (VideoFrameRate > 0 && Duration > 0) {
    perc = ((frame / (VideoFrameRate * Duration)) * 100);
  } else {
    perc = (frame);
  }

  const percString = perc.toFixed(2);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(perc)) {
    return 0.00;
  }

  return parseFloat(percString);
};

const ffmpegParser = ({
  str,
  frameCount,

  videoFrameRate,
  ffprobeDuration,
  metaDuration,
}: {
  str: string,
  frameCount: number,

  videoFrameRate: number | undefined,
  ffprobeDuration: string | undefined,
  metaDuration: number | undefined,
}): number => {
  if (typeof str !== 'string') {
    return 0;
  }

  let percentage = 0;
  if (str.length >= 6) {
    const n = str.indexOf('fps');

    if (n >= 6) {
      // get frame
      const frame = getFFmpegVar({
        str,
        variable: 'frame',
      });

      const frameRate = videoFrameRate || 0;
      let duration = 0;

      if (
        ffprobeDuration
        && parseFloat(ffprobeDuration) > 0
      ) {
        duration = parseFloat(ffprobeDuration);
      } else if (metaDuration) {
        duration = metaDuration;
      }

      const per = getFFmpegPercentage(
        {
          f: frame,
          fc: frameCount,
          vf: frameRate,
          d: duration,
        },
      );

      const outputNum = Number(per);
      if (outputNum > 0) {
        percentage = outputNum;
      }
    }
  }

  return percentage;
};

const editreadyParser = ({ str }:{str: string}): number => {
  if (typeof str !== 'string') {
    return 0;
  }
  let percentage = 0;

  // const ex = 'STATUS: {"progress": "0.0000000"}';

  if (str.includes('STATUS:')) {
    const parts = str.split('STATUS:');

    if (parts[1]) {
      try {
        const json = JSON.parse(parts[1]);
        const progress = parseFloat(json.progress);
        const percStr = (progress * 100).toFixed(2);
        percentage = parseFloat(percStr);
      } catch (err) {
        // err
      }
    }
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(percentage)) {
    return 0.00;
  }

  return percentage;
};

export {
  handbrakeParser,
  ffmpegParser,
  getFFmpegPercentage,
  getFFmpegVar,
  editreadyParser,
};
