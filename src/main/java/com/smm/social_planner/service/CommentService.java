package com.smm.social_planner.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smm.social_planner.dto.CommentDTO;
import com.smm.social_planner.model.Comment;
import com.smm.social_planner.repository.CommentRepository;

@Service
public class CommentService {
    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment saveComment(Comment comment) {
        return commentRepository.save(comment);
    }

    public CommentDTO saveCommentDTO(CommentDTO commentDTO) {
        Comment comment = convertToEntity(commentDTO);
        Comment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }

    public List<Comment> getCommentsByPost(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    public List<CommentDTO> getCommentsDTOByPost(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Metodi helper di conversione
    public CommentDTO convertToDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId().toString());
        dto.setPostId(comment.getPostId().toString());
        dto.setAuthorId(comment.getAuthorId() != null ? comment.getAuthorId().toString() : null);
        dto.setBody(comment.getBody());
        dto.setCreatedAt(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null);
        return dto;
    }

    public Comment convertToEntity(CommentDTO dto) {
        Comment comment = new Comment();
        if (dto.getId() != null) {
            comment.setId(UUID.fromString(dto.getId()));
        }
        if (dto.getPostId() != null) {
            comment.setPostId(UUID.fromString(dto.getPostId()));
        }
        if (dto.getAuthorId() != null) {
            comment.setAuthorId(UUID.fromString(dto.getAuthorId()));
        }
        comment.setBody(dto.getBody());
        return comment;
    }
}