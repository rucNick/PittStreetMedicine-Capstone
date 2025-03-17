package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.document.CargoImage;
import com.backend.streetmed_backend.repository.Cargo.CargoImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class CargoImageService {
    private final CargoImageRepository imageRepository;

    @Autowired
    public CargoImageService(CargoImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    public CargoImage storeImage(MultipartFile file, Integer cargoItemId) throws IOException {
        CargoImage image = new CargoImage();
        image.setFilename(file.getOriginalFilename());
        image.setContentType(file.getContentType());
        image.setData(file.getBytes());
        image.setSize(file.getSize());
        image.setUploadDate(LocalDateTime.now());
        image.setCargoItemId(cargoItemId);

        return imageRepository.save(image);
    }

    public CargoImage getImage(Integer cargoItemId) {
        return imageRepository.findByCargoItemId(cargoItemId)
                .orElseThrow(() -> new RuntimeException("Image not found for cargo item: " + cargoItemId));
    }

    public void deleteImage(Integer cargoItemId) {
        imageRepository.deleteByCargoItemId(cargoItemId);
    }
}