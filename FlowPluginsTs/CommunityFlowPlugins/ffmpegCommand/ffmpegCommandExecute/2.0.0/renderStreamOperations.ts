import { IpluginInputArgs } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { IworkingStream } from './renderTypes';
import {
  getNestedProperty,
  markRemoved,
} from './renderUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

export const applyRemoveStreamByProperty = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const codecType = String(inputs.codecType).trim();
  const propertyToCheck = String(inputs.propertyToCheck).trim();
  const valuesToRemove = String(inputs.valuesToRemove).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(inputs.condition);
  let changed = false;

  streams
    .filter((stream) => codecType === 'any' || stream.codec_type === codecType)
    .forEach((stream) => {
      const target = getNestedProperty(stream, propertyToCheck);

      if (target === undefined || target === null) {
        return;
      }

      const prop = String(target).toLowerCase();
      const lowerValues = valuesToRemove.map((val) => val.toLowerCase());
      let shouldRemove = false;

      switch (condition) {
        case 'includes':
          shouldRemove = lowerValues.some((val) => prop.includes(val));
          break;
        case 'not_includes':
          shouldRemove = !lowerValues.some((val) => prop.includes(val));
          break;
        case 'equals':
          shouldRemove = lowerValues.some((val) => prop === val);
          break;
        case 'not_equals':
          shouldRemove = !lowerValues.some((val) => prop === val);
          break;
        default:
          shouldRemove = false;
      }

      const valuesStr = valuesToRemove.join(', ');
      const action = shouldRemove ? 'Removing' : 'Keep';
      args.jobLog(
        `${action} stream index ${stream.index} because ${propertyToCheck} of ${prop} ${condition} ${valuesStr}\n`,
      );

      if (shouldRemove) {
        changed = markRemoved(stream) || changed;
      }
    });

  return changed;
};

export const applyContainerConform = (
  streams: IworkingStream[],
  container: string,
): boolean => {
  let changed = false;

  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];

    try {
      const codecType = stream.codec_type.toLowerCase();
      const codecName = stream.codec_name.toLowerCase();

      if (
        container === 'mkv'
        && (
          codecType === 'data'
          || [
            'mov_text',
            'eia_608',
            'timed_id3',
          ].includes(codecName)
        )
      ) {
        changed = markRemoved(stream) || changed;
      }

      if (
        container === 'mp4'
        && (
          codecType === 'attachment'
          || [
            'hdmv_pgs_subtitle',
            'eia_608',
            'timed_id3',
            'subrip',
            'ass',
            'ssa',
          ].includes(codecName)
        )
      ) {
        changed = markRemoved(stream) || changed;
      }
    } catch (err) {
      // Ignore incomplete stream metadata.
    }
  }

  return changed;
};

export const applyReorderStreams = (
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): IworkingStream[] => {
  let reorderedStreams = [...streams];

  const sortStreams = (sortType: {
    inputs: string,
    getValue: (stream: IworkingStream) => string,
  }) => {
    const items = sortType.inputs.split(',');
    items.reverse();
    for (let i = 0; i < items.length; i += 1) {
      const matchedStreams = [];
      for (let j = 0; j < reorderedStreams.length; j += 1) {
        if (String(sortType.getValue(reorderedStreams[j])) === String(items[i])) {
          if (
            reorderedStreams[j].codec_long_name
            && (
              reorderedStreams[j].codec_long_name.includes('image')
              || reorderedStreams[j].codec_name.includes('png')
            )
          ) {
            // Do not move image streams due to FFmpeg map behavior.
          } else {
            matchedStreams.push(reorderedStreams[j]);
            reorderedStreams.splice(j, 1);
            j -= 1;
          }
        }
      }
      reorderedStreams = matchedStreams.concat(reorderedStreams);
    }
  };

  const sortTypes: {
    [key: string]: {
      getValue: (stream: IworkingStream) => string;
      inputs: string;
    };
  } = {
    languages: {
      getValue: (stream: IworkingStream) => {
        if (stream?.tags?.language) {
          return stream.tags.language;
        }

        return '';
      },
      inputs: String(inputs.languages),
    },
    codecs: {
      getValue: (stream: IworkingStream) => {
        try {
          return stream.codec_name;
        } catch (err) {
          // Ignore incomplete stream metadata.
        }
        return '';
      },
      inputs: String(inputs.codecs),
    },
    channels: {
      getValue: (stream: IworkingStream) => {
        const chanMap: {
          [key: number]: string
        } = {
          8: '7.1',
          6: '5.1',
          2: '2',
          1: '1',
        };

        if (stream?.channels && chanMap[stream.channels]) {
          return chanMap[stream.channels];
        }

        return '';
      },
      inputs: String(inputs.channels),
    },
    streamTypes: {
      getValue: (stream: IworkingStream) => {
        if (stream.codec_type) {
          return stream.codec_type;
        }
        return '';
      },
      inputs: String(inputs.streamTypes),
    },
  };

  const processOrderArr = String(inputs.processOrder).split(',');

  for (let k = 0; k < processOrderArr.length; k += 1) {
    if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
      sortStreams(sortTypes[processOrderArr[k]]);
    }
  }

  return reorderedStreams;
};
