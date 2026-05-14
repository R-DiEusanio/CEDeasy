package com.smm.social_planner.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.smm.social_planner.dto.ProfileDTO;
import com.smm.social_planner.model.Client;
import com.smm.social_planner.model.Profile;
import com.smm.social_planner.model.Smm;
import com.smm.social_planner.repository.ProfileRepository;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public ProfileDTO upsertProfile(String userId, String fullName, String email, String role) {
        UUID id = UUID.fromString(userId);
        return profileRepository.findById(id).map(existing -> {
            existing.setFullName(fullName);
            return convertToDTO(profileRepository.save(existing));
        }).orElseGet(() -> {
            Profile profile;
            if ("SMM".equalsIgnoreCase(role)) {
                Smm smm = new Smm();
                smm.setId(id);
                smm.setFullName(fullName);
                smm.setEmail(email);
                profile = smm;
            } else {
                Client client = new Client();
                client.setId(id);
                client.setFullName(fullName);
                client.setEmail(email);
                profile = client;
            }
            return convertToDTO(profileRepository.save(profile));
        });
    }

    public ProfileDTO getProfile(String userId) {
        UUID id = UUID.fromString(userId);
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profilo non trovato: " + userId));
        return convertToDTO(profile);
    }

    public ProfileDTO convertToDTO(Profile profile) {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(profile.getId().toString());
        dto.setFullName(profile.getFullName());
        dto.setEmail(profile.getEmail());
        dto.setRole(profile instanceof Smm ? "SMM" : "CLIENT");
        return dto;
    }
}
