package com.smm.social_planner.dto;

import lombok.Data;

@Data
public class PostDTO {
    private String id;
    private String brandId;
    private String title;
    private String caption; // Mappa 'content'
    private String type;    // Mappa 'platform'
    private String date;    // Mappa 'scheduledDate' + 'scheduledTime'
    private String status;  // Mappa 'status' (minuscolo)
    private String feedback;
    private boolean hasChangesRequested;
}