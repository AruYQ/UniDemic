// Mock react-native and expo modules for Node verification environment
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      StyleSheet: { create: (s: any) => s },
      Pressable: 'Pressable',
      View: 'View',
      Text: 'Text',
      Alert: { alert: () => {} },
    };
  }
  if (id === 'expo-constants') {
    return { default: { expoConfig: {} } };
  }
  if (id === 'expo-secure-store') {
    return {
      getItemAsync: async () => null,
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    };
  }
  return originalRequire.apply(this, arguments);
};

function assert(condition: any, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

assert.strictEqual = function (actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but received ${actual}`);
  }
};

import type { ProjectTask } from '../src/types/collaboration';

const api = require('../src/lib/api').default;
const { collaborationService } = require('../src/services/collaborationService');
const { useCollaborationStore } = require('../src/store/useCollaborationStore');
const {
  createStudyGroupSchema,
  joinStudyGroupSchema,
  createProjectSchema,
  createMilestoneSchema,
  createProjectTaskSchema,
  connectGithubSchema,
} = require('../src/types/collaboration');

async function runTests() {
  let passed = 0;
  const recordedRequests: Array<{ method: string; url: string; data?: any; params?: any }> = [];

  // Intercept Axios methods for contract & store verification
  (api as any).get = async (url: string, config?: any) => {
    recordedRequests.push({ method: 'GET', url, params: config?.params });
    if (url === '/study-groups') {
      return {
        data: {
          success: true,
          data: [
            {
              id: 1,
              name: 'Algoritma Study Group',
              creator_id: 1,
              invite_code: 'ALGO1234',
              is_public: true,
              members_count: 3,
              projects_count: 1,
              created_at: '2026-11-19T00:00:00Z',
              updated_at: '2026-11-19T00:00:00Z',
            },
          ],
        },
      };
    }
    if (url === '/projects/10') {
      return {
        data: {
          success: true,
          data: {
            id: 10,
            creator_id: 1,
            name: 'UniDemic Mobile',
            status: 'active',
            milestones: [
              {
                id: 100,
                project_id: 10,
                title: 'MVP Kanban',
                is_completed: false,
                order: 0,
                created_at: '2026-11-19T00:00:00Z',
                updated_at: '2026-11-19T00:00:00Z',
              },
            ],
            tasks: [
              {
                id: 1,
                project_id: 10,
                creator_id: 1,
                title: 'Task A',
                status: 'todo',
                priority: 'high',
                position: 0,
                created_at: '2026-11-19T00:00:00Z',
                updated_at: '2026-11-19T00:00:00Z',
              },
              {
                id: 2,
                project_id: 10,
                creator_id: 1,
                title: 'Task B',
                status: 'todo',
                priority: 'medium',
                position: 1,
                created_at: '2026-11-19T00:00:00Z',
                updated_at: '2026-11-19T00:00:00Z',
              },
            ],
            github_repo: null,
            created_at: '2026-11-19T00:00:00Z',
            updated_at: '2026-11-19T00:00:00Z',
          },
        },
      };
    }
    return { data: { success: true, data: [] } };
  };

  let shouldFailNextPatch = false;
  (api as any).patch = async (url: string, data?: any) => {
    recordedRequests.push({ method: 'PATCH', url, data });
    if (shouldFailNextPatch) {
      shouldFailNextPatch = false;
      throw { response: { data: { message: 'Network conflict' } } };
    }
    return { data: { success: true, data: { id: 1, status: data?.status || 'in_progress', position: data?.position ?? 0 } } };
  };

  (api as any).post = async (url: string, data?: any) => {
    recordedRequests.push({ method: 'POST', url, data });
    if (url === '/projects/10/github/connect') {
      return {
        data: {
          success: true,
          data: {
            id: 5,
            project_id: 10,
            repo_owner: data.repo_owner,
            repo_name: data.repo_name,
            full_name: `${data.repo_owner}/${data.repo_name}`,
            default_branch: data.default_branch || 'main',
            html_url: `https://github.com/${data.repo_owner}/${data.repo_name}`,
            has_webhook_secret: Boolean(data.webhook_secret),
            has_access_token: Boolean(data.access_token),
            created_at: '2026-11-19T00:00:00Z',
            updated_at: '2026-11-19T00:00:00Z',
          },
        },
      };
    }
    return { data: { success: true, data: { id: 99, ...data } } };
  };

  (api as any).put = async (url: string, data?: any) => {
    recordedRequests.push({ method: 'PUT', url, data });
    return { data: { success: true, data: { id: 1, ...data } } };
  };

  (api as any).delete = async (url: string) => {
    recordedRequests.push({ method: 'DELETE', url });
    return { data: { success: true } };
  };

  // 1. Zod Validation Tests
  assert(createStudyGroupSchema.safeParse({ name: 'A' }).success === false, 'Short group name must fail');
  assert(createStudyGroupSchema.safeParse({ name: 'AI Study Group', max_members: 30 }).success === true, 'Valid group must pass');
  assert(joinStudyGroupSchema.safeParse({ invite_code: 'AB' }).success === false, 'Short invite code must fail');
  assert(createProjectSchema.safeParse({ name: 'Capstone App' }).success === true, 'Valid project must pass');
  assert(createMilestoneSchema.safeParse({ title: 'Sprint 1' }).success === true, 'Valid milestone must pass');
  assert(createProjectTaskSchema.safeParse({ title: 'Build UI' }).success === true, 'Valid task must pass');
  assert(connectGithubSchema.safeParse({ repo_owner: 'invalid owner!', repo_name: 'UniDemic' }).success === false, 'Invalid owner must fail');
  assert(connectGithubSchema.safeParse({ repo_owner: 'AruYQ', repo_name: 'UniDemic' }).success === true, 'Valid repo must pass');
  passed += 8;

  // 2. Service Endpoint Contract Tests
  await collaborationService.getStudyGroups({ discover: true, search: 'algo' });
  const lastReq1 = recordedRequests[recordedRequests.length - 1];
  assert.strictEqual(lastReq1.method, 'GET');
  assert.strictEqual(lastReq1.url, '/study-groups');
  assert.strictEqual(lastReq1.params.discover, true);

  await collaborationService.moveProjectTask(1, { status: 'in_progress', position: 0 });
  const lastReq2 = recordedRequests[recordedRequests.length - 1];
  assert.strictEqual(lastReq2.method, 'PATCH');
  assert.strictEqual(lastReq2.url, '/project-tasks/1/move');

  await collaborationService.reorderProjectTasks(10, { tasks: [{ id: 1, status: 'done', position: 0 }] });
  const lastReq3 = recordedRequests[recordedRequests.length - 1];
  assert.strictEqual(lastReq3.method, 'POST');
  assert.strictEqual(lastReq3.url, '/projects/10/tasks/reorder');
  passed += 3;

  // 3. Zustand Store State & Optimistic Kanban Re-indexing Tests
  const store = useCollaborationStore.getState();
  await store.fetchStudyGroups({ forceRefresh: true });
  assert.strictEqual(useCollaborationStore.getState().myStudyGroups.length, 1);

  await store.fetchProjectDetail(10);
  assert.strictEqual(useCollaborationStore.getState().tasks.length, 2);

  // Move Task 1 from todo -> in_progress; Task 2 in todo should shift to position 0
  await useCollaborationStore.getState().moveProjectTask(1, 'in_progress', 0);
  const afterMoveTasks: ProjectTask[] = useCollaborationStore.getState().tasks;
  const movedT1 = afterMoveTasks.find((t) => t.id === 1);
  const shiftedT2 = afterMoveTasks.find((t) => t.id === 2);
  assert.strictEqual(movedT1?.status, 'in_progress');
  assert.strictEqual(movedT1?.position, 0);
  assert.strictEqual(shiftedT2?.status, 'todo');
  assert.strictEqual(shiftedT2?.position, 0);
  passed += 4;

  // Test rollback when API PATCH fails
  shouldFailNextPatch = true;
  let caught = false;
  try {
    await useCollaborationStore.getState().moveProjectTask(1, 'done', 0);
  } catch {
    caught = true;
  }
  assert(caught, 'Failed move should reject and rollback');
  assert.strictEqual(
    useCollaborationStore.getState().tasks.find((t: ProjectTask) => t.id === 1)?.status,
    'in_progress',
    'Rollback should restore previous status'
  );
  passed += 2;

  // Test GitHub connect & sanitized resource flags
  const connected = await useCollaborationStore.getState().connectGithubRepo(10, {
    repo_owner: 'AruYQ',
    repo_name: 'UniDemic',
    default_branch: 'develop',
    access_token: 'secret_token',
  });
  assert.strictEqual(connected.full_name, 'AruYQ/UniDemic');
  assert.strictEqual(connected.has_access_token, true);
  assert.strictEqual((connected as any).access_token, undefined, 'Raw token must not exist on repo resource');
  passed += 3;

  console.log(`\nALL ${passed} MOBILE COLLABORATION CONTRACT & STORE TESTS PASSED!`);
}

runTests().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
