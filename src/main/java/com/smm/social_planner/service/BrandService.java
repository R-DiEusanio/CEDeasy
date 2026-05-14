package com.smm.social_planner.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smm.social_planner.dto.BrandDTO;
import com.smm.social_planner.model.Brand;
import com.smm.social_planner.repository.BrandRepository;

@Service
public class BrandService {
    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public BrandDTO createBrand(BrandDTO brandDTO) {
        Brand brand = convertToEntity(brandDTO);
        Brand savedBrand = brandRepository.save(brand);
        return convertToDTO(savedBrand);
    }

    public List<BrandDTO> getAllBrandsBySmm(UUID smmId) {
        return brandRepository.findBySmmId(smmId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BrandDTO updateBrand(UUID id, BrandDTO brandDTO) {
        return brandRepository.findById(id).map(brand -> {
            brand.setName(brandDTO.getName());
            brand.setOwnerName(brandDTO.getOwnerName());
            brand.setEmail(brandDTO.getEmail());
            brand.setPhone(brandDTO.getPhone());
            brand.setTiktokUrl(brandDTO.getTiktokUrl());
            brand.setInstagramUrl(brandDTO.getInstagramUrl());
            brand.setFacebookUrl(brandDTO.getFacebookUrl());
            brand.setTelegramUrl(brandDTO.getTelegramUrl());
            brand.setLinkedinUrl(brandDTO.getLinkedinUrl());
            Brand updatedBrand = brandRepository.save(brand);
            return convertToDTO(updatedBrand);
        }).orElseThrow(() -> new RuntimeException("Brand non trovato"));
    }

    public void deleteBrand(UUID id) {
        brandRepository.deleteById(id);
    }

    // Metodi helper di conversione
    public BrandDTO convertToDTO(Brand brand) {
        BrandDTO dto = new BrandDTO();
        dto.setId(brand.getId().toString());
        dto.setName(brand.getName());
        dto.setSmmId(brand.getSmmId().toString());
        dto.setOwnerName(brand.getOwnerName());
        dto.setEmail(brand.getEmail());
        dto.setPhone(brand.getPhone());
        dto.setTiktokUrl(brand.getTiktokUrl());
        dto.setInstagramUrl(brand.getInstagramUrl());
        dto.setFacebookUrl(brand.getFacebookUrl());
        dto.setTelegramUrl(brand.getTelegramUrl());
        dto.setLinkedinUrl(brand.getLinkedinUrl());
        return dto;
    }

    public Brand convertToEntity(BrandDTO dto) {
        Brand brand = new Brand();
        if (dto.getId() != null) {
            brand.setId(UUID.fromString(dto.getId()));
        }
        brand.setName(dto.getName());
        brand.setSmmId(UUID.fromString(dto.getSmmId()));
        brand.setOwnerName(dto.getOwnerName());
        brand.setEmail(dto.getEmail());
        brand.setPhone(dto.getPhone());
        brand.setTiktokUrl(dto.getTiktokUrl());
        brand.setInstagramUrl(dto.getInstagramUrl());
        brand.setFacebookUrl(dto.getFacebookUrl());
        brand.setTelegramUrl(dto.getTelegramUrl());
        brand.setLinkedinUrl(dto.getLinkedinUrl());
        return brand;
    }
}