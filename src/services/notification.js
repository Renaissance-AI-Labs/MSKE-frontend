import { reactive } from 'vue';

export const notificationState = reactive({
  visible: false,
  message: '',
  type: 'info',
  timeoutId: null,
});

export function showToast(message, typeOrDuration = 'info', duration = 3000) {
  if (notificationState.timeoutId) {
    clearTimeout(notificationState.timeoutId);
  }

  let type = 'info';
  let timeout = 3000;

  if (typeof typeOrDuration === 'number') {
    timeout = typeOrDuration;
  } else {
    type = typeOrDuration || 'info';
    if (typeof duration === 'number') {
      timeout = duration;
    }
  }

  notificationState.message = message;
  notificationState.type = type;
  notificationState.visible = true;

  notificationState.timeoutId = setTimeout(() => {
    notificationState.visible = false;
  }, timeout);
}
