package com.smm.social_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private String id;
    private String brandId;
    private String title;
    private String caption;
    private String type;
    private String date;
    private String status;
    private boolean hasChangesRequested;
    private String mediaLink;
    private String internalNotes;
}
