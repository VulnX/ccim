import 'package:file_picker/file_picker.dart';
import 'package:flutter/widgets.dart';

class PasteData {
  TextData textData = TextData();
  FilesData filesData = FilesData();
  EncryptionData encData = EncryptionData();
}

class TextData {
  static const _maxMessageLength = 1_000_000;
  TextEditingController controller = TextEditingController();

  String validate() {
    if (controller.text.length > _maxMessageLength) {
      throw MaxMessageLengthExceededException(
        'Too long',
        'Your message exceeds the maximum limit of 1 million characters. Please shorten it',
      );
    }
    return controller.text;
  }
}

class FilesData {
  static const _maxSize = 100 * 1024 * 1024;
  int totalSize = 0;
  List<PlatformFile>? files;

  void setFiles(List<PlatformFile> files) {
    int totalSize = files.fold(
      0,
      (prevSize, currFile) => prevSize + currFile.size,
    );
    if (totalSize > _maxSize) {
      throw MaxTotalFileSizeExceededException(
        'Size limit exceeded',
        'Your selected file(s) exceed the maximum size limit of 100MiB per clipboard. Please choose smaller file(s)',
      );
    }

    this.totalSize = totalSize;
    this.files = files;
  }

  void clearFiles() {
    files = null;
    totalSize = 0;
  }
}

class EncryptionData {
  bool useEncryption = true;
  TextEditingController controller = TextEditingController();

  String validate() {
    if (controller.text.isEmpty) {
      throw EmptyEncPasswordException(
        'Empty password',
        'Cannot have an empty password. Please disable encryption if you do not wish to use it',
      );
    }
    if (!(controller.text.length <= 32)) {
      throw PasswordTooLongException(
        'Too long',
        'Password cannot be more than 32 characters',
      );
    }
    return controller.text;
  }
}

// SECTION START: Custom exceptions

abstract class CustomException implements Exception {
  final String title;
  final String description;

  CustomException(this.title, this.description);
}

class MaxTotalFileSizeExceededException extends CustomException {
  MaxTotalFileSizeExceededException(super.title, super.description);
}

class MaxMessageLengthExceededException extends CustomException {
  MaxMessageLengthExceededException(super.title, super.description);
}

class EmptyEncPasswordException extends CustomException {
  EmptyEncPasswordException(super.title, super.description);
}

class PasswordTooLongException extends CustomException {
  PasswordTooLongException(super.title, super.description);
}

// SECTION END
