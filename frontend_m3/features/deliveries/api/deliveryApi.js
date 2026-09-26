import client from '../../../shared/api/client';

const BASE = '/deliveries';

export const deliveryApi = {
  list: (params) => client.get(BASE, { params }).then((r) => r.data.data),
  getById: (id) => client.get(`${BASE}/${id}`).then((r) => r.data.data),
  create: (payload) => client.post(BASE, payload).then((r) => r.data.data),
  update: (id, payload) => client.patch(`${BASE}/${id}`, payload).then((r) => r.data.data),
  checkAvailability: (id) => client.get(`${BASE}/${id}/availability`).then((r) => r.data.data),
  validate: (id) => client.post(`${BASE}/${id}/validate`).then((r) => r.data.data),
  cancel: (id) => client.post(`${BASE}/${id}/cancel`).then((r) => r.data.data),
};
