import { computed, ref } from 'vue';

export class NetworkActivityService {
  private readonly pendingRequests = ref<number>(0);

  readonly pendingCount = computed(() => this.pendingRequests.value);
  readonly isBusy = computed(() => this.pendingRequests.value > 0);

  async track<T>(task: () => Promise<T>): Promise<T> {
    this.pendingRequests.value++;
    try {
      return await task();
    } finally {
      this.pendingRequests.value = Math.max(0, this.pendingRequests.value - 1);
    }
  }
}

export const networkActivity = new NetworkActivityService();
