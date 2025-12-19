import React, { useEffect, useMemo, useState } from 'react';
import {
  CollisionDetection,
  DndContext,
  DragOverlay,
  DragEndEvent,
  MouseSensor,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Ticket, Project } from '../types';
import { Column } from './Column';
import { DeferZone } from './DeferZone';
import { TicketModal } from './TicketModal';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { getProjectById } from '../lib/db';

export const Board: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const {
    tickets,
    selectedDate,
    selectedProjectId,
    selectedTagId,
    deferredTicket,
    loadTickets,
    moveTicket,
    deferTicket,
    clearDeferred,
    moveToDate,
    archiveDay,
    setSelectedDate,
  } = useKanban();

  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  useEffect(() => {
    if (selectedProjectId) {
      getProjectById(selectedProjectId).then((p: Project | undefined) => {
        if (p) setProject(p);
      });
    } else {
      setProject(null);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTickets(selectedDate);
  }, [selectedDate, selectedProjectId, selectedTagId, loadTickets]);

  const todoTickets = tickets.filter((t) => t.status === 'todo');
  const inProgressTickets = tickets.filter((t) => t.status === 'inProgress');
  const doneTickets = tickets.filter((t) => t.status === 'done');

  const ticketById = useMemo(() => {
    const map = new Map<string, Ticket>();
    for (const t of tickets) map.set(t.id, t);
    return map;
  }, [tickets]);

  const activeTicket = activeTicketId ? ticketById.get(activeTicketId) ?? null : null;

  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return rectIntersection(args);
  };

  const openNewTicket = () => {
    setEditingTicket(null);
    setShowModal(true);
  };

  const openEditTicket = (t: Ticket) => {
    setEditingTicket(t);
    setShowModal(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    const ticketId = event.active?.id ? String(event.active.id) : null;

    setActiveTicketId(null);

    if (!ticketId || !overId) return;

    if (overId === 'defer') {
      const ticket = ticketById.get(ticketId);
      if (ticket) deferTicket(ticket);
      return;
    }

    if (overId === 'todo' || overId === 'inProgress' || overId === 'done') {
      await moveTicket(ticketId, overId);
    }
  };

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveTicketId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveTicketId(null);
  };

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };


  return (
    <div
      className="boardRoot"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: colors.input,
      }}
    >
      <div
        style={{
          padding: '18px 22px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 12,
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: '4px 10px',
                backgroundColor: colors.background,
              }}
            >
              {project ? 'Project' : 'Day'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: '4px 10px',
                backgroundColor: colors.background,
              }}
            >
              {selectedDate}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {project?.icon && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flex: '0 0 auto',
                }}
              >
                {project.icon.type === 'image' ? (
                  <img
                    src={project.icon.value}
                    alt=""
                    style={{ width: 18, height: 18, borderRadius: 6 }}
                  />
                ) : (
                  <span style={{ fontSize: 16 }}>{project.icon.value}</span>
                )}
              </div>
            )}
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 650,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {project?.name || 'Kanban'}
            </h1>
            <span style={{ color: colors.muted, fontSize: 18 }}>☆</span>
          </div>

          <div style={{ marginTop: 6, fontSize: 13, color: colors.muted }}>
            {project ? getFormattedDate(selectedDate) : 'Daily flow'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 999,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: 13,
            }}
          />

          <button
            onClick={openNewTicket}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: '38px',
            }}
            aria-label="Add ticket"
            title="Add ticket"
          >
            +
          </button>

          <button
            onClick={archiveDay}
            style={{
              padding: '10px 12px',
              borderRadius: 999,
              backgroundColor: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Archive
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div
          className="boardBody"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '18px 22px',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: 0,
            }}
          >
            <div
              className="boardColumnsRow"
              style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}
            >
              <Column
                title="To Do"
                columnKey="todo"
                tickets={todoTickets}
                onAdd={openNewTicket}
                onTicketClick={openEditTicket}
              />
              <Column
                title="In Progress"
                columnKey="inProgress"
                tickets={inProgressTickets}
                onTicketClick={openEditTicket}
              />
              <Column
                title="Done"
                columnKey="done"
                tickets={doneTickets}
                onTicketClick={openEditTicket}
              />
            </div>
          </div>

          <div className="boardDeferRow" style={{ minHeight: 0 }}>
            <DeferDropTarget colors={colors}>
              <DeferZone
                deferredTicket={deferredTicket}
                onClear={clearDeferred}
                onMoveToDate={moveToDate}
              />
            </DeferDropTarget>
          </div>
        </div>

        <DragOverlay dropAnimation={null} style={{ pointerEvents: 'none' }}>
          {activeTicket ? (
            <div style={{ width: 260 }}>
              <div
                style={{
                  padding: 10,
                  borderRadius: 14,
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 14px 40px rgba(0,0,0,0.16)',
                  opacity: 0.98,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontWeight: 650, fontSize: 14, letterSpacing: '-0.01em' }}>
                  {activeTicket.title}
                </div>
                {activeTicket.description && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: colors.muted,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {activeTicket.description}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TicketModal
        isOpen={showModal}
        defaultProjectId={selectedProjectId}
        defaultDate={selectedDate}
        ticket={editingTicket}
        onClose={() => {
          setShowModal(false);
          setEditingTicket(null);
        }}
      />
    </div>
  );
};

const DeferDropTarget: React.FC<{
  colors: { warning: string };
  children: React.ReactNode;
}> = ({ colors, children }) => {
  // IMPORTANT: this hook must be under <DndContext/> in the rendered tree.
  const { setNodeRef, isOver } = useDroppable({ id: 'defer' });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 12,
        outline: isOver ? `2px solid ${colors.warning}` : 'none',
        outlineOffset: 2,
        display: 'flex',
      }}
    >
      {children}
    </div>
  );
};
