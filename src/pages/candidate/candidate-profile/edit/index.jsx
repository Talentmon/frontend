import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { I } from './icons';
import { createId, createInitialState, schemaOf } from './data';
import { loadProfile, saveProfile } from '../profileStore';
import {
  candidateToBasics,
  customSectionToFrontend,
  DEDICATED_LIST_RESOURCES,
  isCustomBackedSection,
  mergeCustomSections,
  preferencesIsComplete,
  preferencesToFrontend,
  removeCandidatePhoto,
  syncCandidateCustomSections,
  syncCandidateLinks,
  updateMyCandidate,
  updateMyCandidatePreferences,
  uploadCandidatePhoto,
} from '../candidateApi';
import { useCurrentUser } from '../../../../lib/CurrentUserContext';
import { useMyCandidateProfile } from '../../../../hooks/useMyCandidateProfile';
import BasicsSection from './BasicsSection';
import TextSection from './TextSection';
import PrefsSection from './PrefsSection';
import ListSection from './ListSection';
import AddContentModal from './AddContentModal';
import ToastHost from './ToastHost';
import CvPreview from './CvPreview';
import './styles.scss';

const SUMMARY_MIN_LENGTH = 200;
const REQUIRED_BASICS_FIELDS = ['name', 'role', 'location', 'phone'];

const CandidateProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { candidate, refetch: refetchCandidate } = useMyCandidateProfile();
  const [state, setState] = useState(() => loadProfile() || createInitialState());
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const originalLinksRef = useRef([]);
  const originalListRefs = useRef({});
  const originalCustomSectionsRef = useRef([]);
  const originalPreferencesRef = useRef(null);
  const [openIds, setOpenIds] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [previewMode, setPreviewMode] = useState('self');
  const [modalOpen, setModalOpen] = useState(false);
  const [savedMode, setSavedMode] = useState(false);
  const [mobilePane, setMobilePane] = useState('edit');
  const [dirty, setDirty] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [secDragId, setSecDragId] = useState(null);
  const [secArmedId, setSecArmedId] = useState(null);
  const [secDropInfo, setSecDropInfo] = useState(null);

  const toastTimers = useRef({});
  const isFirstRender = useRef(true);

  // Merge real basics + links + experience + education from the backend once
  // loaded — does NOT mark `dirty` (this is a load, not a user edit). Other
  // sections (skills/languages/certificates/custom/preferences) stay
  // local-only until their own wiring step.
  useEffect(() => {
    if (!candidate) return;
    const basics = candidateToBasics(candidate, user?.email);
    originalLinksRef.current = basics.links;
    const backendCustomSections = candidate.customSections || [];
    const backendPreferences = preferencesToFrontend(candidate.preferences);
    originalCustomSectionsRef.current = backendCustomSections.map(customSectionToFrontend);
    originalPreferencesRef.current = backendPreferences;

    const listEntriesByType = {};
    for (const { type, candidateField, toFrontend } of DEDICATED_LIST_RESOURCES) {
      const entries = (candidate[candidateField] || []).map(toFrontend);
      listEntriesByType[type] = entries;
      originalListRefs.current[type] = entries;
    }

    setState((prev) => {
      const mergedSections = mergeCustomSections(prev.sections, backendCustomSections).map((sec) => {
        if (listEntriesByType[sec.type]) return { ...sec, entries: listEntriesByType[sec.type] };
        if (sec.type === 'preferences' && backendPreferences) return { ...sec, data: { ...sec.data, ...backendPreferences } };
        return sec;
      });
      return {
        ...prev,
        basics: { ...prev.basics, ...basics, photo: prev.basics.photo || basics.photo },
        sections: mergedSections,
      };
    });
  }, [candidate, user?.email]);

  const updateState = (mutator) => {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
    setDirty(true);
  };

  // Persist whenever state changes, not inline in updateState — once saveProfile
  // becomes a backend call, it must run as a committed effect, not inside the
  // setState updater (which React/StrictMode may invoke more than once).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveProfile(state);
  }, [state]);

  // ---------- TOAST / UNDO ----------
  const removeToast = (tid) => {
    clearTimeout(toastTimers.current[tid]);
    setToasts((arr) => arr.filter((t) => t.id !== tid));
  };
  const pushToast = (msg, actionLabel, onAction) => {
    const tid = createId();
    setToasts((arr) => [...arr, { id: tid, msg, actionLabel, onAction, in: false }]);
    requestAnimationFrame(() => setToasts((arr) => arr.map((t) => (t.id === tid ? { ...t, in: true } : t))));
    toastTimers.current[tid] = setTimeout(() => removeToast(tid), 4500);
  };
  const handleToastAction = (tid) => {
    const t = toasts.find((x) => x.id === tid);
    removeToast(tid);
    t?.onAction?.();
  };

  // ---------- SECTION OPS ----------
  const toggleSectionOpen = (key) => setOpenIds((o) => ({ ...o, [key]: !o[key] }));
  const startRenameSection = (key) => {
    setRenamingId(key);
    setOpenIds((o) => ({ ...o, [key]: true }));
  };
  const commitRenameSection = (key, value) => {
    if (value != null) {
      updateState((draft) => {
        draft.sections.find((s) => s.id === key).title = value;
      });
    }
    setRenamingId(null);
  };

  const deleteSection = (sectionId) => {
    const secNow = state.sections.find((s) => s.id === sectionId);
    const removedIndex = state.sections.indexOf(secNow);
    updateState((draft) => {
      draft.sections.splice(draft.sections.findIndex((s) => s.id === sectionId), 1);
    });
    if (renamingId === sectionId) setRenamingId(null);
    pushToast(`Section deleted: ${secNow.title}`, 'Undo', () => {
      updateState((draft) => {
        draft.sections.splice(Math.min(removedIndex, draft.sections.length), 0, secNow);
      });
    });
  };

  const reorderSections = (fromId, toId, after) => {
    updateState((draft) => {
      const arr = draft.sections;
      const from = arr.findIndex((s) => s.id === fromId);
      if (from < 0) return;
      const item = arr.splice(from, 1)[0];
      let to = arr.findIndex((s) => s.id === toId);
      if (to < 0) to = arr.length;
      arr.splice(after ? to + 1 : to, 0, item);
    });
  };
  const moveSectionByKeyboard = (id, dir) => {
    updateState((draft) => {
      const arr = draft.sections;
      const i = arr.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return;
      arr.splice(j, 0, arr.splice(i, 1)[0]);
    });
  };

  const sectionDragPropsFor = (sectionId) => ({
    sectionDrag: {
      draggable: secArmedId === sectionId,
      onDragStart: (e) => {
        setSecDragId(sectionId);
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', sectionId);
        } catch {
          // some browsers restrict setData outside a user gesture context — safe to ignore
        }
      },
      onDragEnd: () => {
        setSecArmedId(null);
        setSecDragId(null);
        setSecDropInfo(null);
      },
      onDragOver: (e) => {
        if (!secDragId || secDragId === sectionId) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        setSecDropInfo({ id: sectionId, after: e.clientY - r.top > r.height / 2 });
      },
      onDrop: (e) => {
        if (!secDragId) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        reorderSections(secDragId, sectionId, e.clientY - r.top > r.height / 2);
        setSecArmedId(null);
        setSecDragId(null);
        setSecDropInfo(null);
      },
    },
    onGripMouseDown: () => setSecArmedId(sectionId),
    onGripMouseUp: () => setSecArmedId((id) => (id === sectionId ? null : id)),
    onGripKeyDown: (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveSectionByKeyboard(sectionId, e.key === 'ArrowDown' ? 1 : -1);
      }
    },
  });
  const sectionDragClassFor = (sectionId) => {
    if (secDragId === sectionId) return 'sec-dragging';
    if (secDropInfo?.id === sectionId) return secDropInfo.after ? 'sec-drop-after' : 'sec-drop-before';
    return '';
  };

  const addSection = (item) => {
    const sectionId = createId();
    const sec = { id: sectionId, type: item.type, kind: item.kind, icon: item.icon, title: item.title };
    if (item.kind === 'text') sec.text = '';
    else sec.entries = [];
    if (item.kind === 'list') sec.schema = item.schema || 'generic';
    if (item.type === 'custom') {
      sec.title = 'Custom';
      sec.kind = 'list';
      sec.schema = 'generic';
      sec.entries = [];
    }
    let blankEntry = null;
    if (sec.kind !== 'text' && sec.kind !== 'prefs') {
      blankEntry = schemaOf(sec).blank();
      sec.entries.push(blankEntry);
    }
    updateState((draft) => {
      draft.sections.push(sec);
    });
    setOpenIds((o) => ({ ...o, [sectionId]: true }));
    if (blankEntry) setEditingId(blankEntry.id);
    if (item.type === 'custom') setRenamingId(sectionId);
    setModalOpen(false);
  };

  // Converts entries between the two local entry shapes instead of dropping
  // them — the backend has no third "skill-style" kind for custom sections
  // (only TEXT/LIST), so this toggle is purely local, and a reload always
  // brings the section back as Standard/LIST. Preserving entries here means
  // re-toggling after a reload can't silently delete already-saved data.
  const setSectionKind = (sectionId, kind) => {
    updateState((draft) => {
      const sec = draft.sections.find((s) => s.id === sectionId);
      if (sec.kind === kind) return;
      sec.kind = kind;
      if (kind === 'skill') {
        delete sec.schema;
        sec.entries = (sec.entries || []).map((e) => ({ id: e.id, name: e.name || e.title || '', visible: e.visible !== false }));
      } else {
        sec.schema = 'generic';
        sec.entries = (sec.entries || []).map((e) => ({
          id: e.id,
          title: e.title || e.name || '',
          subtitle: e.subtitle || '',
          start: e.start || '',
          end: e.end || '',
          location: e.location || '',
          desc: e.desc || '',
          tags: e.tags || [],
          visible: e.visible !== false,
        }));
      }
    });
    setEditingId(null);
  };

  const setSectionText = (sectionId, html) => {
    updateState((draft) => {
      draft.sections.find((s) => s.id === sectionId).text = html;
    });
  };
  const setPrefsField = (sectionId, key, value) => {
    updateState((draft) => {
      draft.sections.find((s) => s.id === sectionId).data[key] = value;
    });
  };

  // ---------- ENTRY OPS ----------
  const addEntry = (sectionId) => {
    const secNow = state.sections.find((s) => s.id === sectionId);
    const blank = schemaOf(secNow).blank();
    updateState((draft) => {
      draft.sections.find((s) => s.id === sectionId).entries.push(blank);
    });
    setEditingId(blank.id);
  };
  const updateEntryField = (sectionId, entryId, fn) => {
    updateState((draft) => {
      const entry = draft.sections.find((s) => s.id === sectionId).entries.find((e) => e.id === entryId);
      fn(entry);
    });
  };
  const toggleEntryVisible = (sectionId, entryId) => {
    updateState((draft) => {
      const entry = draft.sections.find((s) => s.id === sectionId).entries.find((e) => e.id === entryId);
      entry.visible = !entry.visible;
    });
  };
  const deleteEntry = (sectionId, entry) => {
    const secNow = state.sections.find((s) => s.id === sectionId);
    const removedIndex = secNow.entries.indexOf(entry);
    updateState((draft) => {
      const sec = draft.sections.find((s) => s.id === sectionId);
      const i = sec.entries.findIndex((e) => e.id === entry.id);
      if (i >= 0) sec.entries.splice(i, 1);
    });
    if (editingId === entry.id) setEditingId(null);
    const schema = schemaOf(secNow);
    const label = (schema.summary(entry).title || schema.noun).replace(/<[^>]+>/g, '');
    pushToast(`Deleted: ${label}`, 'Undo', () => {
      updateState((draft) => {
        const sec = draft.sections.find((s) => s.id === sectionId);
        sec.entries.splice(Math.min(removedIndex, sec.entries.length), 0, entry);
      });
      setOpenIds((o) => ({ ...o, [sectionId]: true }));
      setEditingId(entry.id);
    });
  };
  const reorderEntries = (sectionId, fromId, toId, after) => {
    updateState((draft) => {
      const arr = draft.sections.find((s) => s.id === sectionId).entries;
      const from = arr.findIndex((e) => e.id === fromId);
      if (from < 0) return;
      const item = arr.splice(from, 1)[0];
      let to = arr.findIndex((e) => e.id === toId);
      if (to < 0) to = arr.length;
      arr.splice(after ? to + 1 : to, 0, item);
    });
  };
  const moveEntry = (sectionId, entryId, dir) => {
    updateState((draft) => {
      const arr = draft.sections.find((s) => s.id === sectionId).entries;
      const i = arr.findIndex((e) => e.id === entryId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return;
      arr.splice(j, 0, arr.splice(i, 1)[0]);
    });
  };

  // ---------- BASICS OPS ----------
  const setBasicsField = (key, value) =>
    updateState((draft) => {
      draft.basics[key] = value;
    });
  const setBasicsPhoto = async (file) => {
    const preview = new FileReader();
    preview.onload = () => {
      updateState((draft) => {
        draft.basics.photo = preview.result;
      });
    };
    preview.readAsDataURL(file);

    setPhotoBusy(true);
    try {
      const url = await uploadCandidatePhoto(file);
      updateState((draft) => {
        draft.basics.photoUrl = url;
        draft.basics.photo = draft.basics.photoHidden ? null : url;
      });
    } catch (err) {
      pushToast(err?.message || 'Could not upload photo — please try again.');
      updateState((draft) => {
        draft.basics.photo = draft.basics.photoUrl || null;
      });
    } finally {
      setPhotoBusy(false);
    }
  };
  const removeBasicsPhoto = async () => {
    setPhotoBusy(true);
    try {
      await removeCandidatePhoto();
      updateState((draft) => {
        draft.basics.photo = null;
        draft.basics.photoUrl = null;
      });
    } catch (err) {
      pushToast(err?.response?.data?.message || 'Could not remove photo — please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };
  const changeLink = (linkId, field, value) =>
    updateState((draft) => {
      draft.basics.links.find((l) => l.id === linkId)[field] = value;
    });
  const addLink = () =>
    updateState((draft) => {
      draft.basics.links.push({ id: createId(), label: '', url: '' });
    });
  const removeLink = (linkId) =>
    updateState((draft) => {
      draft.basics.links = draft.basics.links.filter((l) => l.id !== linkId);
    });

  // ---------- SAVE & VIEW ----------
  const handleSaveAndView = async () => {
    const hasEmptyBasics = REQUIRED_BASICS_FIELDS.some((key) => !String(state.basics[key] || '').trim());
    if (hasEmptyBasics) {
      setOpenIds((o) => ({ ...o, basics: true }));
      pushToast('Fill in all required fields in the "Basics" section.');
      return;
    }
    const summarySec = state.sections.find((s) => s.type === 'summary');
    if (summarySec) {
      const plain = (summarySec.text || '').replace(/<[^>]*>/g, '').trim();
      if (plain.length < SUMMARY_MIN_LENGTH) {
        setOpenIds((o) => ({ ...o, [summarySec.id]: true }));
        pushToast(`Summary must be at least ${SUMMARY_MIN_LENGTH} characters (currently ${plain.length}).`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateMyCandidate({
        name: state.basics.name,
        roleTitle: state.basics.role,
        location: state.basics.location,
        phoneCode: state.basics.phoneCode,
        phone: state.basics.phone,
        linkedin: state.basics.linkedin,
        photoHidden: !!state.basics.photoHidden,
      });
      const resolvedLinks = await syncCandidateLinks(originalLinksRef.current, state.basics.links);
      originalLinksRef.current = resolvedLinks;

      const resolvedByType = {};
      for (const { type, sync } of DEDICATED_LIST_RESOURCES) {
        const sec = state.sections.find((s) => s.type === type);
        const resolved = sec ? await sync(originalListRefs.current[type] || [], sec.entries) : [];
        resolvedByType[type] = resolved;
        originalListRefs.current[type] = resolved;
      }

      const customSections = state.sections.filter(isCustomBackedSection);
      const resolvedCustomSections = await syncCandidateCustomSections(originalCustomSectionsRef.current, customSections);
      originalCustomSectionsRef.current = resolvedCustomSections;

      const prefsSec = state.sections.find((s) => s.type === 'preferences');
      if (prefsSec && preferencesIsComplete(prefsSec.data)) {
        originalPreferencesRef.current = await updateMyCandidatePreferences(prefsSec.data).then(preferencesToFrontend);
      }

      updateState((draft) => {
        draft.basics.links = resolvedLinks;
        let ci = 0;
        draft.sections = draft.sections.map((sec) => {
          if (resolvedByType[sec.type]) return { ...sec, entries: resolvedByType[sec.type] };
          if (isCustomBackedSection(sec)) return resolvedCustomSections[ci++] || sec;
          return sec;
        });
      });
      await refetchCandidate();
    } catch (err) {
      pushToast(err?.response?.data?.message || 'Could not save your profile — please try again.');
      return;
    } finally {
      setSaving(false);
    }

    saveProfile(state);
    setDirty(false);
    setSavedMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleBackToEdit = () => {
    setSavedMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSection = (sec) => {
    const common = {
      open: !!openIds[sec.id],
      renaming: renamingId === sec.id,
      onToggleOpen: () => toggleSectionOpen(sec.id),
      onStartRename: () => startRenameSection(sec.id),
      onRenameCommit: (v) => commitRenameSection(sec.id, v),
      onDeleteSection: () => deleteSection(sec.id),
      sectionDragProps: sectionDragPropsFor(sec.id),
      sectionDragClassName: sectionDragClassFor(sec.id),
    };
    if (sec.kind === 'text') {
      return <TextSection key={sec.id} sec={sec} {...common} onChangeText={(html) => setSectionText(sec.id, html)} />;
    }
    if (sec.kind === 'prefs') {
      return <PrefsSection key={sec.id} sec={sec} {...common} onChangeData={(k, v) => setPrefsField(sec.id, k, v)} />;
    }
    return (
      <ListSection
        key={sec.id}
        sec={sec}
        schema={schemaOf(sec)}
        {...common}
        editingId={editingId}
        setEditingId={setEditingId}
        onSetKind={(kind) => setSectionKind(sec.id, kind)}
        onAddEntry={() => addEntry(sec.id)}
        onUpdateEntry={(entryId, fn) => updateEntryField(sec.id, entryId, fn)}
        onToggleVisible={(entryId) => toggleEntryVisible(sec.id, entryId)}
        onDeleteEntry={(entry) => deleteEntry(sec.id, entry)}
        onReorderEntries={(fromId, toId, after) => reorderEntries(sec.id, fromId, toId, after)}
        onMoveEntry={(entryId, dir) => moveEntry(sec.id, entryId, dir)}
      />
    );
  };

  return (
    <div className={`cpe-page${mobilePane === 'preview' ? ' show-preview' : ''}`}>
      <Helmet>
        <title>Edit profile · Talentmon</title>
      </Helmet>

      <header className="topbar">
        <div className="wrap topbar-in">
          <span className="brand">
            <span className="mk">
              <img src="/assets/images/talentmon.png" alt="Talentmon" />
            </span>
            <span>Talent<b>mon</b></span>
          </span>
          <span className="tb-title">{savedMode ? 'Profile preview' : 'Editing profile'}</span>
          <div className="tb-right">
            <span className={`save-state${dirty ? ' saving' : ''}`}>
              <span className="sdot" />
              <span>{dirty ? 'Unsaved changes' : 'All saved'}</span>
            </span>
            {savedMode ? (
              <button type="button" className="btn btn-line" onClick={handleBackToEdit}>
                <I name="back" />
                Back to editing
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-line" onClick={() => navigate('/candidate-profile')}>
                  <I name="back" />
                  Back to profile
                </button>
                <button type="button" className="btn btn-gold" onClick={handleSaveAndView} disabled={saving}>
                  <I name="eyeFilled" />
                  {saving ? 'Saving…' : 'Save and view'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page">
        {!savedMode ? (
          <div className="wrap">
            <div className="seg">
              <button type="button" className={mobilePane === 'edit' ? 'on' : ''} onClick={() => setMobilePane('edit')}>
                Edit
              </button>
              <button type="button" className={mobilePane === 'preview' ? 'on' : ''} onClick={() => setMobilePane('preview')}>
                Preview
              </button>
            </div>

            <div className="edit-grid">
              <div className="editor-col">
                <div className="col-head">
                  <div>
                    <h1>Edit profile</h1>
                    <p className="sub">Drag to reorder, hide with the eye icon — changes appear instantly on the right.</p>
                  </div>
                </div>
                <div className="sections">
                  <BasicsSection
                    basics={state.basics}
                    open={!!openIds.basics}
                    onToggleOpen={() => toggleSectionOpen('basics')}
                    onChangeField={setBasicsField}
                    onPhotoUpload={setBasicsPhoto}
                    onPhotoRemove={removeBasicsPhoto}
                    photoBusy={photoBusy}
                    onChangeLink={changeLink}
                    onAddLink={addLink}
                    onRemoveLink={removeLink}
                    photoHidden={!!state.basics.photoHidden}
                    onTogglePhotoHidden={() => updateState((draft) => { draft.basics.photoHidden = !draft.basics.photoHidden; })}
                  />
                  {state.sections.map(renderSection)}
                  <div className="add-content-wrap">
                    <button type="button" className="add-content" onClick={() => setModalOpen(true)}>
                      <I name="plus" />
                      Add section
                    </button>
                  </div>
                </div>
              </div>

              <div className="preview-col">
                <div className="col-head">
                  <div className="pv-toggle">
                    <button type="button" className={previewMode === 'self' ? 'on' : ''} onClick={() => setPreviewMode('self')}>
                      My view
                    </button>
                    <button type="button" className={previewMode === 'company' ? 'on' : ''} onClick={() => setPreviewMode('company')}>
                      Company view
                    </button>
                  </div>
                </div>
                <div className="pv-frame">
                  <div className="pv-bar">
                    {previewMode === 'self' ? (
                      <>
                        <I name="eyeFilled" />
                        <span>
                          Full preview — <b>everything included</b>, as if you were unlocked
                        </span>
                      </>
                    ) : (
                      <>
                        <I name="building" />
                        <span>
                          Company view — <b>name, photo, and contact</b> hidden until unlocked
                        </span>
                      </>
                    )}
                  </div>
                  <div className="pv-scroll">
                    <div className="cv">
                      <CvPreview state={state} mode={previewMode} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="saved-wrap">
            <div className="saved-flash">
              <I name="check" strokeWidth={2.4} />
              Your changes have been saved to your CV.
            </div>
            <div className="saved-card">
              <div className="cv">
                <CvPreview state={state} mode="self" />
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastHost toasts={toasts} onAction={handleToastAction} />
      <AddContentModal open={modalOpen} onClose={() => setModalOpen(false)} onPick={addSection} />
    </div>
  );
};

export default CandidateProfileEdit;
