'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from './ui/command';
import { Check, Triangle, User, FolderKanban, X, RefreshCw, CircleDashed, CircleDot, Tags, SignalHigh, SignalMedium, SignalLow, Ban, ShieldAlert, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { StatusBadge, type IssueStatus } from './status-badge';
import { PriorityBadge, type IssuePriority } from './priority-badge';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ElementType;
  color?: string;
  avatarUrl?: string;
  fallback?: string;
}

interface EditableFieldProps {
  initialValue: any;
  onSave: (value: any, action?: 'add' | 'remove' | 'set') => void;
  fieldName: string;
  editType?: 'input' | 'textarea' | 'date' | 'select';
  selectOptions?: SelectOption[];
  isTextarea?: boolean;
  placeholder?: string;
  dateDisabled?: any;
  maxLength?: number;
  className?: string;
  renderCharCount?: (node: React.ReactNode) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showHoverIcon?: boolean;
}

const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return '';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const Linkify = ({ text }: { text: string | null | undefined }) => {
  if (!text) return <>{text}</>;

  const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(\bhttps?:\/\/[^\s,."'?!<>()]*)/g;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const [fullMatch, mdTitle, mdUrl, rawUrl] = match;

    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (mdUrl) {
      parts.push(
        <a
          key={match.index}
          href={mdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          {mdTitle}
        </a>
      );
    } else if (rawUrl) {
      parts.push(
        <a
          key={match.index}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          {rawUrl}
        </a>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  if (parts.length === 0) {
      return <>{text}</>
  }

  return <>{parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}</>;
};


const EditableFieldComponent = (props: EditableFieldProps) => {
  const {
    initialValue,
    onSave,
    fieldName,
    editType = 'input',
    selectOptions = [],
    isTextarea = false,
    placeholder,
    maxLength,
    className,
    renderCharCount,
    open,
    onOpenChange,
    showHoverIcon = true,
  } = props;


  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue || '');
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(inputRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Initialize char count when editing starts
      if (renderCharCount && maxLength) {
          const currentText = inputRef.current.textContent || '';
          renderCharCount(
            <div className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 animate-in fade-in duration-200 uppercase tracking-widest">
                {currentText.length}/{maxLength}
            </div>
          );
      }
    }
    if (!isEditing && renderCharCount) {
        renderCharCount(null);
    }
  }, [isEditing, renderCharCount, maxLength]);

  const handleBlur = () => {
    if (!inputRef.current) return;
    const finalContent = inputRef.current?.textContent || '';
    setIsEditing(false);
    if (finalContent !== initialValue) {
      onSave(finalContent);
    }
    setLocalValue(finalContent);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentLength = e.currentTarget.textContent?.length || 0;
    if (maxLength && currentLength >= maxLength && !['Backspace','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Delete','Tab'].includes(e.key) && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
    }

    if (e.key === 'Enter' && (!isTextarea || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (inputRef.current) {
          inputRef.current.textContent = initialValue || '';
      }
      handleBlur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let currentText = e.currentTarget.textContent || '';
    if (maxLength && currentText.length > maxLength) {
        currentText = currentText.substring(0, maxLength);
        e.currentTarget.textContent = currentText;
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
          range.selectNodeContents(e.currentTarget);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
    }
    if (renderCharCount && maxLength) {
        renderCharCount(
          <div className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase tracking-widest">
              {currentText.length}/{maxLength}
          </div>
        );
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const currentText = e.currentTarget.textContent || '';
    if (maxLength) {
      const remaining = maxLength - currentText.length;
      if (remaining > 0) {
        document.execCommand('insertText', false, pastedText.substring(0, remaining));
      }
    } else {
      document.execCommand('insertText', false, pastedText);
    }
  };


  // ---------- Dropdown / Select ----------
  const [value, setValue] = useState(initialValue);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const isPopoverOpen = isControlled ? open : internalOpen;
  const setPopoverOpen = isControlled ? onOpenChange || setInternalOpen : setInternalOpen;
  
  const [highlightedValue, setHighlightedValue] = useState(
    typeof initialValue === 'string' ? initialValue : ''
  );

  useEffect(() => {
    if (initialValue !== value) {
        setValue(initialValue);
    }
    setHighlightedValue(typeof initialValue === 'string' ? initialValue : '');
  }, [initialValue]);

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (!open) {
      if (fieldName !== 'labels') {
        setHighlightedValue(typeof value === 'string' ? value : '');
      }
    }
  };

  const selectedOption = selectOptions.find(o => String(o.value) === String(value));

  const renderOption = (option: SelectOption) => {
    const iconMap: { [key in IssuePriority]: React.ElementType } = {
        Urgent: ShieldAlert,
        High: SignalHigh,
        Medium: SignalMedium,
        Low: SignalLow,
        None: Ban,
    };

    switch (fieldName) {
      case 'status': return <StatusBadge status={option.value as IssueStatus} />;
      case 'priority': 
        const PriorityIcon = iconMap[option.value as IssuePriority] || Ban;
        const config = PriorityBadge.priorityConfig[option.value as IssuePriority];
        return (
           <div className="flex items-center gap-2">
            <PriorityIcon className={cn('h-4 w-4', config.iconClassName)} />
            <span className="font-bold uppercase tracking-tight text-[11px]">{option.label}</span>
          </div>
        );
      case 'assigneeId':
      case 'reporterId':
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border shadow-sm">
              <AvatarImage src={option.avatarUrl} />
              <AvatarFallback className="text-[10px] font-bold">{option.fallback}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm">{option.label}</span>
          </div>
        );
      case 'storyPoints':
        return (
          <div className="flex items-center gap-2">
            <Triangle className="h-4 w-4 text-muted-foreground opacity-70" />
            <span className="font-bold text-sm">{option.label}</span>
          </div>
        );
      case 'moduleId':
        return (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary opacity-70" />
            <span className="font-bold text-sm">{option.label}</span>
          </div>
        );
      case 'cycle':
        return (
          <div className="flex items-center gap-2">
            {option.icon && <option.icon className={cn('h-4 w-4', option.value !== 'no-cycle' ? 'text-yellow-500' : 'text-muted-foreground')} />}
            <span className="font-bold text-sm">{option.label}</span>
          </div>
        );
      case 'labels':
        return (
          <div className="flex items-center gap-2">
            {option.color && <div className={cn("h-2.5 w-2.5 rounded-full", option.color)} />}
            <span className="font-bold uppercase tracking-tight text-[11px]">{option.label}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            {option.icon && <option.icon className="h-4 w-4" />}
            <span className="font-bold">{option.label}</span>
          </div>
        );
    }
  };

  if (editType === 'input' || editType === 'textarea') {
      if (isEditing) {
        return (
            <div
                ref={inputRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                className={cn('editable-input focus:bg-accent/5 px-1 rounded-sm transition-colors', className)}
            >{localValue}</div>
        );
      }

      return (
          <div
            onClick={() => setIsEditing(true)}
            data-placeholder={placeholder}
            className={cn(
              'editable-input cursor-text whitespace-pre-wrap break-words min-h-[1em] hover:bg-muted/50 px-1 rounded-sm transition-all',
              !localValue && 'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50',
              className
            )}
          >
            {fieldName === 'description' ? <Linkify text={localValue} /> : localValue}
          </div>
      );
  }

  if (editType === 'select') {
      let DisplayComponent;

      if (fieldName === 'status') {
          DisplayComponent = <StatusBadge status={value as IssueStatus} />;
      } else if (fieldName === 'priority') {
          DisplayComponent = <PriorityBadge priority={value as IssuePriority} />;
      } else if (fieldName === 'assigneeId' || fieldName === 'reporterId') {
          DisplayComponent = (
              <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center">
                  {selectedOption?.avatarUrl ? (
                      <Avatar className="h-6 w-6 border shadow-sm">
                          <AvatarImage src={selectedOption.avatarUrl} />
                          <AvatarFallback className="text-[10px] font-bold">{selectedOption.fallback}</AvatarFallback>
                      </Avatar>
                  ) : <User className="h-5 w-5 text-muted-foreground opacity-70" />}
                  </div>
                  <span className="truncate font-bold text-foreground/90">{selectedOption?.label || placeholder || 'Unassigned'}</span>
              </div>
          );
      } else if (fieldName === 'moduleId') {
          if (!selectedOption) {
              DisplayComponent = (
                  <div className="text-muted-foreground italic gap-2 flex items-center">
                      <FolderKanban className="h-4 w-4 opacity-70" />
                      <span className="font-bold text-xs uppercase tracking-tight">{placeholder || 'No module'}</span>
                  </div>
              );
          } else {
            DisplayComponent = (
                <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-primary shadow-sm transition-all hover:bg-primary/20">
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span className="truncate">{selectedOption.label}</span>
                    <div
                        className="h-4 w-4 rounded-full flex items-center justify-center cursor-pointer group/remove-btn hover:bg-primary/30 ml-1"
                        onClick={(e) => { e.stopPropagation(); onSave(null); }}
                        role="button"
                        aria-label="Clear module selection"
                    >
                        <X className="h-3 w-3" />
                    </div>
                </div>
            )
          }
      } else if (fieldName === 'storyPoints') {
          const selectedLabel = selectOptions.find(o => String(o.value) === String(value))?.label;
          const displayValue = value != null && value != 0 ? (selectedLabel || String(value)) : (placeholder || 'None');
          const showIcon = value === null || value === undefined || value == 0;
          DisplayComponent = (
              <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[11px] text-foreground/90">
                  {showIcon && <Triangle className="h-3.5 w-3.5 text-muted-foreground opacity-70" />}
                  <span>{displayValue}</span>
              </div>
          );
      } else if (fieldName === 'cycle') {
          if (!value) {
              DisplayComponent = <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-tight"><CircleDashed className="h-4 w-4 opacity-70" /><span>{placeholder || 'No cycle'}</span></div>;
          } else {
              const currentCycle = selectOptions.find((o) => o.value === value);
              if (!currentCycle) {
                  DisplayComponent = <span className="font-bold">{value}</span>;
              } else {
                  const Icon = currentCycle.icon || RefreshCw;
                  DisplayComponent = (
                    <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[11px]">
                      <Icon className={cn('h-3.5 w-3.5', value === 'no-cycle' ? 'text-muted-foreground opacity-70' : 'text-yellow-600')} />
                      <span className="text-foreground/90">{currentCycle.label}</span>
                    </div>
                  );
              }
          }
      } else if (fieldName === 'labels') {
          const selectedLabels = (Array.isArray(value) ? value : [])
            .map(labelId => selectOptions.find(o => o.value === labelId))
            .filter(Boolean) as SelectOption[];

          DisplayComponent = (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedLabels.map(label => (
                  <div 
                      key={label.value} 
                      className="group/label-badge relative flex items-center gap-1.5 rounded-md border-2 border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all hover:border-destructive/50 hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); onSave(label.value, 'remove'); }}
                  >
                    {label.color && <div className={cn("h-2.5 w-2.5 rounded-full", label.color)} />}
                    <span className="text-primary/90 group-hover/label-badge:text-destructive">{label.label}</span>
                    <X className="h-3 w-3 text-primary/60 transition-colors group-hover/label-badge:text-destructive"/>
                  </div>
                ))}
                <PopoverTrigger asChild>
                     <Button variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1.5 text-xs font-bold uppercase tracking-tight transition-all active:scale-95" type="button">
                      <Tags className="h-3.5 w-3.5" />
                      <span>Label</span>
                    </Button>
              </PopoverTrigger>
            </div>
          );
      } else {
          DisplayComponent = <span className={cn('font-bold', !value ? 'text-muted-foreground italic' : 'text-foreground')}>{selectedOption?.label || value || placeholder || 'Click to edit'}</span>
      }
      
      const PopoverTriggerWrapper = fieldName === 'labels' ? 'div' : PopoverTrigger;
      
      return (
          <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
              <PopoverTriggerWrapper
                  role="button"
                  aria-expanded={isPopoverOpen}
                  className={cn(
                  'w-full flex items-center justify-start h-auto font-normal text-sm text-foreground group transition-all',
                  (fieldName !== 'labels') && 'p-1.5 rounded-md hover:bg-muted min-h-[36px] cursor-pointer active:scale-[0.99]',
                  className
                  )}
              >
                  {DisplayComponent}
                   {showHoverIcon && fieldName !== 'labels' && (
                        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
              </PopoverTriggerWrapper>

              <PopoverContent
                  side="bottom"
                  align="start"
                  className="w-[250px] p-0 pointer-events-auto z-50 shadow-2xl border-primary/20"
                  sideOffset={4}
                  onOpenAutoFocus={e => e.preventDefault()}
              >
                  <Command>
                  <CommandList className="max-h-[300px]">
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                      {selectOptions.map(option => {
                          const isSelected = fieldName === 'labels'
                          ? Array.isArray(value) && value.includes(option.value)
                          : String(value) === String(option.value);

                          return (
                          <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                              if (fieldName === 'labels') {
                                  onSave(option.value, isSelected ? 'remove' : 'add');
                              } else {
                                  setValue(option.value);
                                  onSave(option.value);
                                  setPopoverOpen(false);
                              }
                              }}
                              className="flex items-center justify-between cursor-pointer transition-colors py-2.5 px-3 hover:bg-accent hover:text-accent-foreground"
                          >
                              {renderOption(option)}
                              <Check className={cn("h-4 w-4 text-primary", isSelected ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                          )
                      })}
                      </CommandGroup>
                  </CommandList>
                  </Command>
              </PopoverContent>
          </Popover>
      );
  }

  return null;
};

export const EditableField = React.memo(EditableFieldComponent);