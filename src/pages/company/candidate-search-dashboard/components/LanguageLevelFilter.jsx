import React from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { LANGUAGE_NAMES, LEVELS } from 'utils/languages';
import styles from '../styles/dashboard.module.scss';

const languageOptions = LANGUAGE_NAMES.map((language) => ({ value: language, label: language }));

// Proficiency sub-filter shown per selected language - picking one or more
// levels matches candidates at exactly those levels; none picked ("Any
// level", the default) keeps the language selected without constraining it.
const languageLevelOptions = LEVELS.map((level) => ({ value: level, label: level }));

/**
 * Language filter shared by Search (FilterSidebar) and Bookmarked. The value
 * is { name, levels }[] so proficiency can be constrained per language: the
 * name Select adds/removes entries (keeping levels already chosen for names
 * that stay), each row narrows its language to levels, and its X removes it.
 * A candidate matches with any picked language at one of its picked levels.
 */
const LanguageLevelFilter = ({ id, value = [], onChange, placeholder = 'Select languages' }) => {
  const handleNamesChange = (names) => {
    onChange(names?.map((name) => value?.find((entry) => entry?.name === name) || { name, levels: [] }));
  };

  const handleLevelsChange = (name, levels) => {
    onChange(value?.map((entry) => (entry?.name === name ? { ...entry, levels } : entry)));
  };

  const handleRemove = (name) => {
    onChange(value?.filter((entry) => entry?.name !== name));
  };

  return (
    <>
      <Select
        id={id}
        options={languageOptions}
        value={value?.map((entry) => entry?.name)}
        onChange={handleNamesChange}
        placeholder={placeholder}
        multiple
        searchable
      />
      {value?.length > 0 && (
        <ul className={styles.languageLevelRows} aria-label="Language levels">
          {value?.map((entry) => (
            <li className={styles.languageLevelRow} key={entry?.name}>
              <span className={styles.languageLevelName}>{entry?.name}</span>
              <span className={styles.languageLevelControls}>
                <Select
                  className={styles.languageLevelSelect}
                  options={languageLevelOptions}
                  value={entry?.levels || []}
                  onChange={(levels) => handleLevelsChange(entry?.name, levels)}
                  placeholder="Any level"
                  aria-label={`Level for ${entry?.name}`}
                  multipleLabel={(count) => `${count} levels`}
                  multiple
                />
                <button
                  type="button"
                  className={styles.languageLevelRemove}
                  onClick={() => handleRemove(entry?.name)}
                  aria-label={`Remove ${entry?.name}`}
                >
                  <Icon name="X" size={14} strokeWidth={2.4} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default LanguageLevelFilter;
