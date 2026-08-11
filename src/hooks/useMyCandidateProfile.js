import { useCallback, useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';

/**
 * Single source of truth for `GET /candidates/me` (full profile: basics,
 * links, experiences, education, skills, languages, certifications,
 * customSections, preferences). Candidate-profile pages compose their local
 * mock-backed `state` from this instead of each doing their own fetch.
 */
export function useMyCandidateProfile() {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/candidates/me');
      setCandidate(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  return { candidate, loading, error, refetch };
}
