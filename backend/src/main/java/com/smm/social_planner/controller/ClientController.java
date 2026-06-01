package com.smm.social_planner.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smm.social_planner.dto.PostDTO;
import com.smm.social_planner.model.Client;
import com.smm.social_planner.model.Profile;
import com.smm.social_planner.repository.ProfileRepository;
import com.smm.social_planner.service.PostService;

@RestController
@RequestMapping("/api/client")
public class ClientController {

    private final ProfileRepository profileRepository;
    private final PostService postService;

    public ClientController(ProfileRepository profileRepository, PostService postService) {
        this.profileRepository = profileRepository;
        this.postService = postService;
    }

    /**
     * Restituisce tutti i post NON bozza del brand del cliente.
     * Richiede che l'utente autenticato abbia un profilo di tipo CLIENT con brandId assegnato.
     */
    @GetMapping("/posts")
    public List<PostDTO> getClientPosts(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profilo non trovato"));

        if (!(profile instanceof Client)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accesso riservato ai clienti");
        }

        Client client = (Client) profile;
        if (client.getBrandId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente non assegnato a nessun brand");
        }

        return postService.getClientVisiblePosts(client.getBrandId());
    }
}
