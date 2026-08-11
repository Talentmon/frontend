import React, { useState } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';

const CandidateNavigationSidebar = ({ 
  candidates = [], 
  currentCandidateId = null, 
  onCandidateSelect = () => {},
  onBookmarkToggle = () => {},
  onClose = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = candidates?.filter(candidate =>
    candidate?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    candidate?.position?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const handleCandidateClick = (candidateId) => {
    onCandidateSelect(candidateId);
  };

  const handleBookmarkClick = (e, candidateId) => {
    e?.stopPropagation();
    onBookmarkToggle(candidateId);
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-card border-l border-border z-[100] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Candidates</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Icon 
            name="Search" 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>
      {/* Candidates List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredCandidates?.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No candidates found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredCandidates?.map((candidate) => (
              <div
                key={candidate?.id}
                onClick={() => handleCandidateClick(candidate?.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted ${
                  currentCandidateId === candidate?.id 
                    ? 'bg-primary/10 border border-primary/20' :'hover:elevation-1'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-muted rounded-full overflow-hidden">
                      {candidate?.avatar ? (
                        <Image
                          src={candidate?.avatar}
                          alt={candidate?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="text-sm font-medium text-primary">
                            {candidate?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                      candidate?.status === 'available' ? 'bg-success' :
                      candidate?.status === 'busy' ? 'bg-warning' : 'bg-muted'
                    }`} />
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {candidate?.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {candidate?.position}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {candidate?.company}
                        </p>
                      </div>
                      
                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => handleBookmarkClick(e, candidate?.id)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        aria-label={candidate?.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                      >
                        <Icon 
                          name="Bookmark" 
                          size={14} 
                          color={candidate?.isBookmarked ? 'var(--color-accent)' : 'var(--color-muted-foreground)'}
                          className={candidate?.isBookmarked ? 'fill-current' : ''}
                        />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {candidate?.skills?.slice(0, 2)?.map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate?.skills?.length > 2 && (
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                          +{candidate?.skills?.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Match Score */}
                    {candidate?.matchScore && (
                      <div className="flex items-center space-x-1 mt-2">
                        <div className="flex-1 bg-muted rounded-full h-1">
                          <div 
                            className="bg-success h-1 rounded-full transition-all duration-300"
                            style={{ width: `${candidate?.matchScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {candidate?.matchScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {filteredCandidates?.length} of {candidates?.length} candidates
        </div>
      </div>
    </div>
  );
};

export default CandidateNavigationSidebar;